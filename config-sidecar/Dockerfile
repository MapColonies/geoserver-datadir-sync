FROM node:14-stretch-slim

WORKDIR /app

RUN chmod g+w /app

COPY package*.json /app/

RUN npm i --only=production

COPY script.mjs .

# RUN useradd -ms /bin/bash user && usermod -a -G root user

# USER user

CMD ["npx", "zx", "./script.mjs"]