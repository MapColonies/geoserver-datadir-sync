FROM node:14-stretch-slim

RUN apt-get -y update && apt-get -y install rsync

WORKDIR /app

RUN chmod g+w /app

COPY package*.json /app/

RUN npm i --only=production

COPY script.mjs .

# uncomment while developing to make sure the docker runs on openshift
# RUN useradd -ms /bin/bash user && usermod -a -G root user
# USER user

CMD ["npx", "zx", "./script.mjs"]