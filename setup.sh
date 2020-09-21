#!/bin/sh
mkdir mongodb
sudo chown -R 10001:65533 registery
sudo chown -R 999:1000 mongodb
docker build -t custom-node-red src/custom-node-red
docker network create internal