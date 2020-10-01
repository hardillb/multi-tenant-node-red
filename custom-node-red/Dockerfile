FROM nodered/node-red:latest-12-minimal

COPY settings.js /data/
USER root
RUN chown -R node-red:root /data
USER node-red
RUN npm install --no-fund --no-update-notifier --save node-red-contrib-auth-mongodb node-red-contrib-storage-mongodb
RUN npm config set @ben:registry http://registry:4873