FROM node:22-alpine

WORKDIR /app

ARG API_INTERNAL_URL=http://backend-bateponto:3000
ENV API_INTERNAL_URL=$API_INTERNAL_URL

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]