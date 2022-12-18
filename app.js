const Fastify = require('fastify')
const FastifyStatic = require('@fastify/static')
const path = require('node:path')

const fastify = Fastify({
  logger: true
})

fastify.register(FastifyStatic, {
  root: path.join(__dirname, 'public'),
})

// Run the server!
fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) throw err
  // Server is now listening on ${address}
})