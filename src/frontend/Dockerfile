FROM node:20-slim

WORKDIR /app

# instala as dependências
COPY package*.json ./
RUN npm install

# copia o restante do código
COPY . . 

# expoe porta padrão do vite
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
