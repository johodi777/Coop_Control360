FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    curl \
    ca-certificates

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /usr/src/app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Comando de inicio
CMD ["node", "src/app.js"]
