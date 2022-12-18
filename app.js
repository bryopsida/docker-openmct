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

fastify.register(FastifyHelmet)
fastify.register(FastifyUnderPressure, {
  maxEventLoopDelay: process.env.FASTIFY_MAX_EVENT_LOOP_DELAY || 1000,
  maxHeapUsedBytes: process.env.FASTIFY_MAX_HEAP_BYTES || 100000000,
  maxRssBytes: process.env.FASTIFY_MAX_RSS_BYTES || 100000000,
  maxEventLoopUtilization: process.env.FASTIFY_MAX_ || 0.98,
  exposeStatusRoute: true
})
fastify.register(FastifyCaching)

const INDEX_CACHE = {

}

function returnUnmodifiedIndex(req, reply) {
  
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


function indexRequest(req, reply) {
  // if we don't have a env var return unmodified index
  if (process.env.OPENMCT_PLUGIN_LOADER_SCRIPT == null) return returnUnmodifiedIndex(req, reply).bind(this)

  // if we have a cached result return that
  if (INDEX_CACHE['index.html'] != null) return returnCachedIndex(req, reply).bind(this)

  return fetchIndexHtml.bind(this)()
    .then(buildDom.bind(this))
    .then(injectPluginScripts.bind(this))
    .then(injectPluginLoader.bind(this))
    .then(cacheIndex.bind(this))
    .then((dom) => {
      return replyWithModifiedIndex(dom, req, reply)
    })
    .catch((err) => {

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