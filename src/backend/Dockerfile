FROM node:22.12.0-slim

# Instala o OpenSSL exigido pelo motor do Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./

# Garante que novas libs (como o zod) sejam instaladas no build
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]