#!/bin/sh
git submodule update --init --recursive
mkdir -p mongodb
sudo chown -R 10001:65533 registry
sudo chown -R 999:1000 mongodb
hn=`hostname`
sed -i -e "s/docker-pi/$hn/g" docker-compose.yml
sed -i -e "s/docker-pi/$hn/g" custom-node-red/settings.js
docker build -t custom-node-red -t custom-node-red:`date +%Y%m%d%H%M%S` custom-node-red
docker network create internal