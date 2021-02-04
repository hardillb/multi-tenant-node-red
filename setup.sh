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
sed -e "s/PLACE_HOLDER/$hn/g" docker-compose.yml-template > docker-compose.yml
sed -e "s/PLACE_HOLDER/$hn/g" custom-node-red/settings.js-template > custom-node-red/settings.js
docker build -t custom-node-red -t custom-node-red:`date +%Y%m%d%H%M%S` custom-node-red
docker network create internal