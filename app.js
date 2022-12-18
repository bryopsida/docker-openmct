const Fastify = require('fastify')
const FastifyStatic = require('@fastify/static')
const FastifyUnderPressure = require('@fastify/under-pressure')
const FastifyHelmet = require('@fastify/helmet')
const FastifyCaching = require('@fastify/caching')
const path = require('node:path')
const fs = require('node:fs/promises')

const fastify = Fastify({
  logger: true
})

//fastify.register(FastifyHelmet)
fastify.register(FastifyUnderPressure, {
  maxEventLoopDelay: process.env.FASTIFY_MAX_EVENT_LOOP_DELAY || 1000,
  maxHeapUsedBytes: process.env.FASTIFY_MAX_HEAP_BYTES || 100000000,
  maxRssBytes: process.env.FASTIFY_MAX_RSS_BYTES || 100000000,
  maxEventLoopUtilization: process.env.FASTIFY_MAX_ || 0.98,
  exposeStatusRoute: true
})
fastify.register(FastifyCaching)

const INDEX_CACHE = {}

function returnUnmodifiedIndex(req, reply) {
  req.log.info('Returning unmodified index.html')
  fs.readFile(path.resolve('./public/index.html'), {
    encoding: 'utf8'
  }).then((file) => {
    reply.header('Content-Type', 'text/html')
    INDEX_CACHE['index.html'] = file
    reply.send(file)
  }).catch((err) => {
    req.log.error(`Error occurred while reading index.html file: ${err}`)
    reply.code(500)
  })
}

function fetchIndexHtml() {
  return fs.readFile(path.resolve('./public/index.html'))
}

function buildDom(fileBuffer) {

}

function injectPluginScripts(dom) {

}

function injectPluginLoader(dom) {

}


function cacheIndex(dom) {

}

function replyWithModifiedIndex(req, reply, dom) {

}

function returnCachedIndex(req, reply) {
  req.log.info('Returning cached index.html')
  reply.header('Content-Type', 'text/html')
  reply.send(INDEX_CACHE['index.html'])
}


function indexRequest(req, reply) {
  // if we have a cached result return that
  if (INDEX_CACHE['index.html'] != null) return returnCachedIndex.bind(this)(req, reply)

  // if we don't have a env var return unmodified index
  if (process.env.OPENMCT_PLUGIN_LOADER_SCRIPT == null) return returnUnmodifiedIndex.bind(this)(req, reply)

  return fetchIndexHtml.bind(this)()
    .then(buildDom.bind(this))
    .then(injectPluginScripts.bind(this))
    .then(injectPluginLoader.bind(this))
    .then(cacheIndex.bind(this))
    .then((dom) => {
      return replyWithModifiedIndex(dom, req, reply)
    })
    .catch((err) => {
      this.logger.error(`Error occurred while building index.html response: ${err}`)
      reply.code(500)
    })
}

fastify.get("/", indexRequest);
fastify.get("/index.html", indexRequest);
fastify.get("/index.htm", indexRequest);

fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'public'),
})

// Run the server!
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err
  // Server is now listening on ${address}
})