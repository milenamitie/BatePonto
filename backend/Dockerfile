FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
EXPOSE 3000
USER node

CMD ["npm", "start"]