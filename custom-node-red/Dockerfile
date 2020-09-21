FROM nodered/node-red

COPY settings.js /data/
USER root
RUN chown -R node-red:root /data
USER node-red
RUN npm install --save node-red-contrib-auth-mongodb
RUN npm install --save node-red-contrib-storage-mongodb
RUN #npm config set @ben:registry http://registry:4873