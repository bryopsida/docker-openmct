# Docker-openmct
## What is this?
This is a multi platform docker build for running a containerized version of NASA's OpenMCT. 
It's using fastify and an alpine base to serve up OpenMCT. It's building against tag 2.1.3 and pulls in base patches nightly.

## How to run?
You can run the container with `docker run -p 3000:3000 ghcr.io/bryopsida/openmct:main`, you'll be able to access the site at http://localhost:3000/
