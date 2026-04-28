# Treenix Starter — production image
FROM node:25-slim

WORKDIR /app
RUN npm i -g tsx

# Cache npm install
COPY package.json package-lock.json ./
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npx vite build --outDir dist-front
RUN chmod +x entrypoint.sh

# Tenant mods dir scanned at runtime
ENV PORT=3211
ENV STATIC_DIR=/app/dist-front
ENV MODS_DIR=/app/tree/mods
EXPOSE 3211
VOLUME /app/tree

CMD ["./entrypoint.sh"]
