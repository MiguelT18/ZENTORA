FROM node:20-slim

RUN apt-get update && apt-get install -y curl unzip

RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash

RUN bun --version

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]
