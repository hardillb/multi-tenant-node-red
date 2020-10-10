#!/bin/sh
git submodule update --init --recursive
mkdir -p mongodb
echo "Setting ownership of registry"
sudo chown -R 10001:65533 registry
echo "Setting ownership of mongodb"
sudo chown -R 999:1000 mongodb
if [ -z "$1" ]
then
  hn=`hostname`.local
else
  hn=$1
fi
sed -i -e "s/docker-pi.local/$hn/g" docker-compose.yml
sed -i -e "s/docker-pi.local/$hn/g" custom-node-red/settings.js
docker build -t custom-node-red -t custom-node-red:`date +%Y%m%d%H%M%S` custom-node-red
docker network create internal