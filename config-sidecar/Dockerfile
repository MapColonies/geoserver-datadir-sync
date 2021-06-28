FROM node:14-stretch-slim

WORKDIR /app

RUN chgrp -R 0 /app

COPY package*.json /app/

RUN npm i --only=production

COPY script.mjs .

CMD ["npx", "zx", "./script.mjs"]