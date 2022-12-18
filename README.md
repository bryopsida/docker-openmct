# Docker-openmct
## What is this?
This is a multi platform docker build for running a containerized version of NASA's OpenMCT. 
It's using fastify and an alpine base to serve up OpenMCT. It's building against tag 2.1.3 and pulls in base patches nightly.

## How to run?
You can run the container with `docker run -p 3000:3000 ghcr.io/bryopsida/openmct:main`, you'll be able to access the site at http://localhost:3000/, you can also run `docker-compose up` to leverage the docker-compose and a local build. 


## How to customize?
The `app.js` script loads the default index.html file from the OpenMCT project and provides touch points to map in your own scripts.

### Plugins
If you have a collection of plugin scripts you wish to include, you can bind mount the folder to `/usr/src/app/public/plugins` and those scripts will automatically be injected into the head element of the `index.html` page.
This is done by mounting the script into the container and setting an environment variable pointing to the path of the script. 
For example `docker run -p 3000:3000 -v <path/to/your/plugins>:/usr/src/app/public/plugins ghcr.io/bryopsida/openmct:main`, everything in the plugins folder will be loaded into the dom.

### Loader Script
In order to do anything with your additional plugins, you need to be load them into openmct and adjust it's configuration, to bring it all together you can provide a loader script that provisions all of your plugins. 
For example 
``` bash
docker run -p 3000:3000 \
  -v <path/to/your/plugins>:/usr/src/app/public/plugins \
  -v <path/to/your/loader/script>:/usr/src/app/loader-script.js \
  -e OPENMCT_PLUGIN_LOADER_SCRIPT=/usr/src/app/loader-script.js \
  ghcr.io/bryopsida/openmct:main
```
You can also take a look at the [docker-compose](./docker-compose.yml) file.

## Future Ideas
- [ ] Support EJB or Handlebar templating in user provided scripts
- [ ] Attach configurable auth middleware and views to support OIDC flows
- [ ] Provide a compose stack example with telemetry from a bus such as Kafka.
- [ ] Provider config file support as another option instead of setting env vars
