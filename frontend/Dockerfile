# Dockerfile para Frontend (Vite + React)
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir aplicación
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage de producción con Nginx
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx personalizada (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

