#!/bin/bash

# Script de deployment automatizado para cliente independiente
# Uso: ./deploy-cliente.sh <nombreCliente> <dominio> <sshKeyPath>
# Ejemplo: ./deploy-cliente.sh clienteA clienteA.com ~/.ssh/id_rsa

set -e

CLIENT_NAME=$1
DOMAIN=$2
SSH_KEY_PATH=$3

if [ -z "$CLIENT_NAME" ] || [ -z "$DOMAIN" ]; then
    echo "❌ Uso: ./deploy-cliente.sh <nombreCliente> <dominio> [sshKeyPath]"
    echo "   Ejemplo: ./deploy-cliente.sh clienteA clienteA.com ~/.ssh/id_rsa"
    exit 1
fi

# Configuración
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-your-server-ip}"
DEPLOY_PATH="/var/www/${CLIENT_NAME}"
SSH_OPTS="-o StrictHostKeyChecking=no"

if [ -n "$SSH_KEY_PATH" ]; then
    SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY_PATH}"
fi

echo "🚀 Iniciando deployment para cliente: ${CLIENT_NAME}"
echo "   Dominio: ${DOMAIN}"
echo "   Servidor: ${SERVER_USER}@${SERVER_HOST}"
echo "   Path: ${DEPLOY_PATH}"

# Función para ejecutar comandos remotos
remote_exec() {
    ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} "$1"
}

# Función para copiar archivos
remote_copy() {
    scp ${SSH_OPTS} -r "$1" ${SERVER_USER}@${SERVER_HOST}:"$2"
}

# 1. Verificar/Crear directorio en servidor
echo ""
echo "📁 Creando estructura de directorios..."
remote_exec "mkdir -p ${DEPLOY_PATH}/{backend,frontend,nginx/ssl,nginx/logs,backups}"

# 2. Instalar Docker y Docker Compose si no existen
echo ""
echo "🐳 Verificando Docker..."
if ! remote_exec "command -v docker &> /dev/null"; then
    echo "   Instalando Docker..."
    remote_exec "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    remote_exec "systemctl enable docker && systemctl start docker"
fi

if ! remote_exec "command -v docker-compose &> /dev/null"; then
    echo "   Instalando Docker Compose..."
    remote_exec "curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    remote_exec "chmod +x /usr/local/bin/docker-compose"
fi

# 3. Copiar archivos del proyecto
echo ""
echo "📦 Copiando archivos del proyecto..."

# Crear archivo temporal con estructura
TEMP_DIR=$(mktemp -d)
mkdir -p ${TEMP_DIR}/{backend,frontend,nginx}

# Copiar backend (excluyendo node_modules)
rsync -avz --exclude 'node_modules' --exclude '.git' \
    ${SSH_OPTS} \
    ./backend/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/backend/

# Copiar frontend (excluyendo node_modules)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    ${SSH_OPTS} \
    ./frontend/ ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/frontend/

# Copiar docker-compose
cp deployment/docker-compose.client.yml ${TEMP_DIR}/docker-compose.yml
remote_copy "${TEMP_DIR}/docker-compose.yml" "${DEPLOY_PATH}/"

# Copiar nginx config
cp deployment/nginx/nginx.conf ${TEMP_DIR}/nginx/nginx.conf
remote_copy "${TEMP_DIR}/nginx/nginx.conf" "${DEPLOY_PATH}/nginx/"

# 4. Crear .env desde template
echo ""
echo "⚙️  Configurando variables de entorno..."
ENV_CONTENT=$(cat deployment/.env.template | \
    sed "s/CLIENT_NAME=.*/CLIENT_NAME=${CLIENT_NAME}/" | \
    sed "s/APP_NAME=.*/APP_NAME=CoopControl 360 - ${CLIENT_NAME}/" | \
    sed "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" | \
    sed "s/DB_NAME=.*/DB_NAME=${CLIENT_NAME}_db/" | \
    sed "s|APP_DOMAIN=.*|APP_DOMAIN=${DOMAIN}|" | \
    sed "s|VITE_API_URL=.*|VITE_API_URL=https://${DOMAIN}/api|" | \
    sed "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN}|" | \
    sed "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|")

# Generar passwords aleatorios
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_ROOT_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)

ENV_CONTENT=$(echo "$ENV_CONTENT" | \
    sed "s/DB_PASS=.*/DB_PASS=${DB_PASS}/" | \
    sed "s/DB_ROOT_PASSWORD=.*/DB_ROOT_PASSWORD=${DB_ROOT_PASS}/" | \
    sed "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/")

echo "$ENV_CONTENT" | remote_exec "cat > ${DEPLOY_PATH}/.env"

echo "   ✓ Variables de entorno configuradas"
echo "   ⚠️  IMPORTANTE: Revisa y actualiza las credenciales en ${DEPLOY_PATH}/.env"

# 5. Instalar Certbot para SSL
echo ""
echo "🔒 Configurando SSL..."
if ! remote_exec "command -v certbot &> /dev/null"; then
    echo "   Instalando Certbot..."
    remote_exec "apt-get update && apt-get install -y certbot python3-certbot-nginx"
fi

# 6. Construir y levantar contenedores
echo ""
echo "🏗️  Construyendo y levantando contenedores..."
remote_exec "cd ${DEPLOY_PATH} && docker-compose down 2>/dev/null || true"
remote_exec "cd ${DEPLOY_PATH} && docker-compose build"
remote_exec "cd ${DEPLOY_PATH} && docker-compose up -d db"
echo "   Esperando que la BD esté lista..."
sleep 10
remote_exec "cd ${DEPLOY_PATH} && docker-compose up -d"

# 7. Ejecutar migraciones
echo ""
echo "🔄 Ejecutando migraciones..."
remote_exec "cd ${DEPLOY_PATH} && docker-compose exec -T backend npm run migrate || true"

# 8. Configurar SSL con Let's Encrypt
echo ""
echo "🔐 Configurando certificado SSL..."
# Nota: Esto requiere que el dominio apunte al servidor
remote_exec "certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect || echo '⚠️  SSL no configurado. Configura manualmente después.'"

# 9. Configurar backups automáticos
echo ""
echo "💾 Configurando backups..."
cat > ${TEMP_DIR}/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
CLIENT_NAME="${CLIENT_NAME}"
DEPLOY_PATH="/var/www/${CLIENT_NAME}"
BACKUP_DIR="${DEPLOY_PATH}/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de BD
docker-compose -f ${DEPLOY_PATH}/docker-compose.yml exec -T db mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Backup de uploads
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz -C ${DEPLOY_PATH}/backend uploads/

# Limpiar backups antiguos (mantener últimos 30 días)
find ${BACKUP_DIR} -name "*.gz" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
BACKUP_SCRIPT

remote_copy "${TEMP_DIR}/backup.sh" "${DEPLOY_PATH}/"
remote_exec "chmod +x ${DEPLOY_PATH}/backup.sh"

# Agregar a crontab
remote_exec "(crontab -l 2>/dev/null | grep -v '${DEPLOY_PATH}/backup.sh'; echo '0 2 * * * ${DEPLOY_PATH}/backup.sh') | crontab -"

# 10. Verificar servicios
echo ""
echo "✅ Verificando servicios..."
sleep 5
if remote_exec "curl -f http://localhost:4000/health > /dev/null 2>&1"; then
    echo "   ✓ Backend respondiendo"
else
    echo "   ⚠️  Backend no responde, revisa los logs"
fi

# Limpiar
rm -rf ${TEMP_DIR}

echo ""
echo "🎉 Deployment completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Verifica que el dominio ${DOMAIN} apunta a ${SERVER_HOST}"
echo "   2. Revisa ${DEPLOY_PATH}/.env y actualiza credenciales"
echo "   3. Si SSL no se configuró automáticamente, ejecuta:"
echo "      certbot --nginx -d ${DOMAIN}"
echo "   4. Verifica los logs:"
echo "      docker-compose -f ${DEPLOY_PATH}/docker-compose.yml logs"
echo ""
echo "🔗 URLs:"
echo "   - Frontend: https://${DOMAIN}"
echo "   - API: https://${DOMAIN}/api"
echo "   - Health: https://${DOMAIN}/health"

