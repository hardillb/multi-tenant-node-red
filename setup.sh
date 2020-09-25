#!/bin/sh
git submodule init
git submodule update
mkdir -p mongodb
sudo chown -R 10001:65533 registry
sudo chown -R 999:1000 mongodb
sed -i -e "s/docker-pi/$HOSTNAME/g" docker-compose.yml
sed -i -e "s/docker-pi/$HOSTNAME/g" custom-node-red/settings.js
docker build -t custom-node-red custom-node-red
docker network create internal