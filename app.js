const Fastify = require('fastify')
const FastifyStatic = require('@fastify/static')
const FastifyUnderPressure = require('@fastify/under-pressure')
const FastifyHelmet = require('@fastify/helmet')
const FastifyCaching = require('@fastify/caching')
const path = require('node:path')
const fs = require('node:fs/promises')
const { JSDOM } = require('jsdom')

const INDEX_CACHE = {}
const INDEX_HTML = path.resolve('./public/index.html')
const PLUGIN_DIR = path.resolve('./public/plugins/')
const INDEX_CACHE_KEY = 'index.html'
const UTF8 = 'utf8'

// create application server
const fastify = Fastify({
  logger: true
})

// register helmet plugin to set security headers
fastify.register(FastifyHelmet)

// register under pressure plugin to get a EP that can be used for readiness and liveness probes
fastify.register(FastifyUnderPressure, {
  maxEventLoopDelay: process.env.FASTIFY_MAX_EVENT_LOOP_DELAY || 1000,
  maxHeapUsedBytes: process.env.FASTIFY_MAX_HEAP_BYTES || 100000000,
  maxRssBytes: process.env.FASTIFY_MAX_RSS_BYTES || 100000000,
  maxEventLoopUtilization: process.env.FASTIFY_MAX_ || 0.98,
  exposeStatusRoute: true
})

// register caching pluging since we are serving static content
fastify.register(FastifyCaching)

/**
 * Return the unmodified upstream version of index.html
 */
function returnUnmodifiedIndex (req, reply) {
  req.log.info('Returning unmodified index.html')
  fs.readFile(INDEX_HTML, {
    encoding: UTF8
  }).then((file) => {
    reply.header('Content-Type', 'text/html')
    INDEX_CACHE[INDEX_CACHE_KEY] = file
    reply.send(file)
  }).catch((err) => {
    req.log.error(`Error occurred while reading index.html file: ${err}`)
    reply.code(500)
  })
}
/**
 * Fetch the upstream index.html file and return as a string
 */
function fetchIndexHtml () {
  return fs.readFile(INDEX_HTML, {
    encoding: UTF8
  })
}

/**
 * Parse the index.html file and convert it into a JSDOM that can be manipulated
 */
function buildDom (indexHtml) {
  return Promise.resolve(new JSDOM(indexHtml))
}

/**
 * Detect all the script files in the plugins directory and inject them at the
 * bottom of the head element
 */
async function injectPluginScripts (dom) {
  this.log.info('Injecting plugin scripts')
  const pluginScripts = await fs.readdir(PLUGIN_DIR)
  this.log.info(`Detected ${pluginScripts.length} plugins`)
  const head = dom.window.document.querySelector('head')
  for (const plugin of pluginScripts) {
    this.log.info(`Loading plugin ${plugin}`)
    const element = dom.window.document.createElement('script')
    element.src = `/plugins/${plugin}`
    head.append(element)
  }
  return Promise.resolve(dom)
}

/**
 * Inject the user provided loader/bootstrap script to configure the user provided plugins
 */
async function injectPluginLoader (dom) {
  const loaderPath = process.env.OPENMCT_PLUGIN_LOADER_SCRIPT
  this.log.info(`Injecting loader script ${loaderPath}`)
  const scriptContents = await fs.readFile(path.resolve(loaderPath), {
    encoding: UTF8
  })
  const body = dom.window.document.querySelector('body')
  const scriptEle = dom.window.document.createElement('script')
  scriptEle.innerHTML = scriptContents
  body.append(scriptEle)
  return Promise.resolve(dom)
}

/**
 * Cache the result to avoid the overhead on future calls
 */
function cacheIndex (dom) {
  INDEX_CACHE[INDEX_CACHE_KEY] = dom.serialize()
  return Promise.resolve(INDEX_CACHE[INDEX_CACHE_KEY])
}

/**
 * Send the modified index.html out to the response buffer
 */
function replyWithModifiedIndex (req, reply, dom) {
  req.log.info('Returning modified and serialized index.html')
  reply.header('Content-Type', 'text/html')
  reply.send(dom)
}

/**
 * Send a cached copy of the index.html to the response buffer
 */
function returnCachedIndex (req, reply) {
  req.log.info('Returning cached index.html')
  reply.header('Content-Type', 'text/html')
  reply.send(INDEX_CACHE[INDEX_CACHE_KEY])
}

/**
 * Process a index request
 */
function indexRequest (req, reply) {
  // if we have a cached result return that
  if (INDEX_CACHE[INDEX_CACHE_KEY] != null) return returnCachedIndex.bind(this)(req, reply)

  // if we don't have a env var return unmodified index
  if (process.env.OPENMCT_PLUGIN_LOADER_SCRIPT == null) return returnUnmodifiedIndex.bind(this)(req, reply)

  return fetchIndexHtml.bind(this)()
    .then(buildDom.bind(this))
    .then(injectPluginScripts.bind(this))
    .then(injectPluginLoader.bind(this))
    .then(cacheIndex.bind(this))
    .then((dom) => {
      return replyWithModifiedIndex(req, reply, dom)
    })
    .catch((err) => {
      req.log.error(`Error occurred while building index.html response: ${err}`)
      // try to return the unmodified index in a best effort
      return returnUnmodifiedIndex(req, reply).catch((err) => {
        req.log.error(`Error occurred while sending unmodified index.htmlin catch handler: ${err}`)
        reply.code(500)
      })
    })
}

/**
 * Map several paths to index requests
 */
fastify.get('/', indexRequest)
fastify.get('/index.html', indexRequest)
fastify.get('/index.htm', indexRequest)

/**
 * Map the static content from the upstream prod build so it can be served up
 */
fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'public')
})

// Run the server!
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err
  // Server is now listening on ${address}
})

// watch for SIGINT and SIGTERM and cleanup when received
function closeHandler () {
  fastify.log.warn('Shutting down')
  fastify.close()
    .then(() => {
      fastify.log.info('Stopped')
      process.exit(0)
    })
    .catch((error) => {
      fastify.log.fatal(error)
      process.exit(1)
    })
}
process.on('SIGINT', closeHandler)
process.on('SIGTERM', closeHandler)
