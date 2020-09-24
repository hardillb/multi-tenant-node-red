#!/bin/sh
git submodules init
git submodules update
docker build -t custom-node-red custom-node-red
mkdir mongodb
sudo chown -R 10001:65533 registry
sudo chown -R 999:1000 mongodb
docker build -t custom-node-red custom-node-red
docker network create internal