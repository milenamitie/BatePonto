FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx next start -H ${HOSTNAME:-0.0.0.0} -p ${PORT:-3000}"]