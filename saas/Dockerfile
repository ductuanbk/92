FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DB_FILE=/data/gio-hang.db
COPY package.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "--no-warnings=ExperimentalWarning", "src/server.js"]
