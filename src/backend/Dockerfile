FROM node:20-slim

WORKDIR /app

# Instala dependências antes de copiar o código para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Porta que o servidor Express utiliza
EXPOSE 3000

CMD ["npm", "run", "dev"]