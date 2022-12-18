const Fastify = require('fastify')
const FastifyStatic = require('@fastify/static')
const FastifyUnderPressure = require('@fastify/under-pressure')
const FastifyHelmet = require('@fastify/helmet')
const FastifyCaching = require('@fastify/caching')
const path = require('node:path')
const fs = require('node:fs')

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

function indexRequest(req, reply) {
  // we need to be able to programatically inject another loader script into the index page
  // without this we cannot extend and load additional plugins
  // we will check for an env var pointing to a loader script location and inject it as a inline script
  // after the main script block, we will use JSDOM to do this
  // the containers are expected to be immutable except for the plugin directory, we will cache the result in memory

  // step 1 check env var
  // if no env set, pipe the default file as a return
  // if env is set continue
  // step 2 load default index.html and parse with jsdom
  // step 3 load script referenced by env var
  //   if script doesn't exist log error and return default content
  // step 4 query index.html and find last script element
  //   if locating script element fails log error and return default content
  // step 5 inject the script contents after the last script element
  // step 6 cache result
  // step 7 return reply
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