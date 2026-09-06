FROM node:22-alpine
WORKDIR /app

COPY web/package.json web/package-lock.json ./web/
WORKDIR /app/web
RUN npm ci

COPY web/ ./
WORKDIR /app
COPY 系統層指令_通用版.txt 稀釋題材預警清單_通用版.md ./

WORKDIR /app/web
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "run", "start"]
