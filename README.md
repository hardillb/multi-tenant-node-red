# Multi Tenant Node-RED Docker Compose

A collection of Docker container that will implement a Multi Tenant Node-RED environment.

## Pre-reqs

Run the following commands in this directory, it will create the volumes to store the MongoDB and the NPM Node repository.

```
mkdir registry mongodb
sudo chown -R 10001:65533 registery
sudo chown -R 999:1000 mongodb
docker build -t custom-node-red src/custom-node-red
docker network create internal
```

And if you are running on a Docker Swarm deployment you will need to build the management app's container manually with.

```
docker build -t manager ./manager
```

When running on a amd64 based host everything should be fine, if you want to run on ARM64 then you  will need to rebuild the verdaccio/verdaccio and nginx-proxy containers as they only ship amd64 versions.

For nginx-proxy you will have to manually build forego since the container directly downloads a pre-built amd64 bit version.

## Configure

You will want to change the `ROOT_DOMAIN` entry at the end of the docker-compse file to match the domain you want to host the Node-RED instances on. You will also want to set up a wildcard DNS entry that points to the host machine.

e.g. if you use a `ROOT_DOMAIN` of docker.local then you should set up a DNS entry for *.docker.local that points to the docker host. 