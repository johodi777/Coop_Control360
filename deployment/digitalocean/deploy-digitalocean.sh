#!/bin/bash

# Script de deployment para DigitalOcean
# Con Load Balancer, Managed Database y CI/CD
# Uso: ./deploy-digitalocean.sh <nombreCliente> <dominio> <doToken>

set -e

CLIENT_NAME=$1
DOMAIN=$2
DO_TOKEN=$3

if [ -z "$CLIENT_NAME" ] || [ -z "$DOMAIN" ] || [ -z "$DO_TOKEN" ]; then
    echo "❌ Uso: ./deploy-digitalocean.sh <nombreCliente> <dominio> <doToken>"
    echo "   Ejemplo: ./deploy-digitalocean.sh clienteA clienteA.com dop_v1_xxxxx"
    exit 1
fi

echo "🚀 Iniciando deployment en DigitalOcean para: ${CLIENT_NAME}"
echo "   Dominio: ${DOMAIN}"

# Instalar doctl si no existe
if ! command -v doctl &> /dev/null; then
    echo "📦 Instalando doctl..."
    cd ~
    wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
    tar xf doctl-1.94.0-linux-amd64.tar.gz
    sudo mv doctl /usr/local/bin
    doctl version
fi

# Autenticar
echo "🔐 Autenticando con DigitalOcean..."
doctl auth init -t $DO_TOKEN

# 1. Crear Droplet
echo ""
echo "💻 Creando Droplet..."
DROPLET_NAME="${CLIENT_NAME}-droplet"
DROPLET_SIZE="s-2vcpu-4gb"  # 2 vCPU, 4GB RAM
DROPLET_REGION="nyc3"
DROPLET_IMAGE="docker-20-04"

DROPLET_ID=$(doctl compute droplet create $DROPLET_NAME \
    --size $DROPLET_SIZE \
    --region $DROPLET_REGION \
    --image $DROPLET_IMAGE \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
    --wait \
    --format ID --no-header)

DROPLET_IP=$(doctl compute droplet get $DROPLET_ID --format PublicIPv4 --no-header)

echo "✓ Droplet creado: $DROPLET_ID"
echo "✓ IP: $DROPLET_IP"

# Esperar a que el droplet esté listo
echo "⏳ Esperando que el droplet esté listo..."
sleep 30

# 2. Crear Managed Database
echo ""
echo "🗄️  Creando Managed Database..."
DB_NAME="${CLIENT_NAME}-db"
DB_SIZE="db-s-1vcpu-1gb"  # 1 vCPU, 1GB RAM
DB_ENGINE="mysql"  # o "postgres" para PostgreSQL

DB_ID=$(doctl databases create $DB_NAME \
    --engine $DB_ENGINE \
    --size $DB_SIZE \
    --region $DROPLET_REGION \
    --format ID --no-header)

echo "✓ Database creada: $DB_ID"
echo "⏳ Esperando que la database esté lista..."
sleep 60

# Obtener credenciales de la database
DB_HOST=$(doctl databases connection $DB_ID --format Host --no-header)
DB_PORT=$(doctl databases connection $DB_ID --format Port --no-header)
DB_USER=$(doctl databases connection $DB_ID --format User --no-header)
DB_PASS=$(doctl databases connection $DB_ID --format Password --no-header)

# Crear base de datos específica
doctl databases db create $DB_ID ${CLIENT_NAME}_db

# 3. Crear Load Balancer
echo ""
echo "⚖️  Creando Load Balancer..."
LB_NAME="${CLIENT_NAME}-lb"

LB_ID=$(doctl compute load-balancer create \
    --name $LB_NAME \
    --region $DROPLET_REGION \
    --forwarding-rules "entry_protocol:http,entry_port:80,target_protocol:http,target_port:80" \
    --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:80" \
    --health-check protocol:http,port:80,path:/health \
    --droplet-ids $DROPLET_ID \
    --format ID --no-header)

LB_IP=$(doctl compute load-balancer get $LB_ID --format IP --no-header)

echo "✓ Load Balancer creado: $LB_ID"
echo "✓ IP: $LB_IP"

# 4. Configurar DNS
echo ""
echo "🌐 Configurando DNS..."
# Asumiendo que tienes un dominio en DigitalOcean
# Ajusta según tu proveedor de DNS

DOMAIN_NAME=$(echo $DOMAIN | cut -d'.' -f2-)
SUBDOMAIN=$(echo $DOMAIN | cut -d'.' -f1)

# Crear registro A apuntando al Load Balancer
doctl compute domain records create $DOMAIN_NAME \
    --record-type A \
    --record-name $SUBDOMAIN \
    --record-data $LB_IP \
    --record-ttl 300 || echo "⚠️  No se pudo crear registro DNS automáticamente"

echo "✓ DNS configurado (o configurar manualmente)"

# 5. Configurar Container Registry
echo ""
echo "📦 Configurando Container Registry..."
REGISTRY_NAME="${CLIENT_NAME}-registry"

doctl registry create $REGISTRY_NAME || echo "⚠️  Registry puede que ya exista"

# Obtener token del registry
REGISTRY_TOKEN=$(doctl registry get | grep -A 5 "Endpoint" | head -1 || echo "")

# 6. Preparar servidor
echo ""
echo "🔧 Preparando servidor..."
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << EOF
    set -e
    
    # Actualizar sistema
    apt-get update
    apt-get upgrade -y
    
    # Instalar herramientas
    apt-get install -y curl wget git ufw certbot python3-certbot-nginx
    
    # Configurar firewall
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    # Crear estructura de directorios
    mkdir -p /var/www/${CLIENT_NAME}/{backend,frontend,nginx/{ssl,logs},backups}
    
    # Login a registry
    echo "${DO_TOKEN}" | doctl auth init -t -
    doctl registry login
    
    echo "✅ Servidor preparado"
EOF

# 7. Copiar archivos de configuración
echo ""
echo "📁 Copiando archivos de configuración..."

scp -o StrictHostKeyChecking=no deployment/digitalocean/docker-compose.production.yml root@$DROPLET_IP:/var/www/$CLIENT_NAME/docker-compose.yml
scp -o StrictHostKeyChecking=no deployment/digitalocean/nginx/nginx.conf root@$DROPLET_IP:/var/www/$CLIENT_NAME/nginx/nginx.conf

# 8. Crear .env
echo ""
echo "⚙️  Creando archivo .env..."

ENV_CONTENT=$(cat deployment/digitalocean/env.production.template | \
    sed "s/CLIENT_NAME=.*/CLIENT_NAME=${CLIENT_NAME}/" | \
    sed "s/APP_NAME=.*/APP_NAME=CoopControl 360 - ${CLIENT_NAME}/" | \
    sed "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" | \
    sed "s|APP_DOMAIN=.*|APP_DOMAIN=${DOMAIN}|" | \
    sed "s/DB_HOST=.*/DB_HOST=${DB_HOST}/" | \
    sed "s/DB_PORT=.*/DB_PORT=${DB_PORT}/" | \
    sed "s/DB_NAME=.*/DB_NAME=${CLIENT_NAME}_db/" | \
    sed "s/DB_USER=.*/DB_USER=${DB_USER}/" | \
    sed "s/DB_PASS=.*/DB_PASS=${DB_PASS}/" | \
    sed "s|VITE_API_URL=.*|VITE_API_URL=https://${DOMAIN}/api|" | \
    sed "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN}|" | \
    sed "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|")

# Generar JWT_SECRET
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)
ENV_CONTENT=$(echo "$ENV_CONTENT" | sed "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/")

echo "$ENV_CONTENT" | ssh root@$DROPLET_IP "cat > /var/www/$CLIENT_NAME/.env"

# 9. Configurar SSL
echo ""
echo "🔒 Configurando SSL..."
ssh root@$DROPLET_IP << EOF
    cd /var/www/$CLIENT_NAME
    
    # Iniciar nginx temporalmente para certbot
    docker-compose up -d nginx || true
    
    # Obtener certificado
    certbot certonly --nginx \
        -d ${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        --webroot-path=/var/www/certbot || echo "⚠️  SSL no configurado automáticamente"
EOF

# 10. Iniciar servicios
echo ""
echo "🚀 Iniciando servicios..."
ssh root@$DROPLET_IP << EOF
    cd /var/www/$CLIENT_NAME
    
    # Pull imágenes
    docker-compose pull
    
    # Iniciar servicios
    docker-compose up -d
    
    # Ejecutar migraciones
    sleep 10
    docker-compose exec -T backend npm run migrate || true
EOF

# 11. Configurar backups
echo ""
echo "💾 Configurando backups..."
ssh root@$DROPLET_IP << 'BACKUP_SCRIPT'
    cat > /var/www/${CLIENT_NAME}/backup.sh << 'EOF'
#!/bin/bash
CLIENT_NAME="${CLIENT_NAME}"
DEPLOY_PATH="/var/www/${CLIENT_NAME}"
BACKUP_DIR="${DEPLOY_PATH}/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de BD (usando doctl)
doctl databases backup create ${DB_ID} --backup-name ${CLIENT_NAME}_${DATE}

# Backup de uploads
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz -C ${DEPLOY_PATH}/backend uploads/ 2>/dev/null || true

# Limpiar backups antiguos
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
EOF
    chmod +x /var/www/${CLIENT_NAME}/backup.sh
    
    # Agregar a crontab
    (crontab -l 2>/dev/null | grep -v "/var/www/${CLIENT_NAME}/backup.sh"; echo "0 2 * * * /var/www/${CLIENT_NAME}/backup.sh") | crontab -
BACKUP_SCRIPT

echo ""
echo "✅ Deployment completado!"
echo ""
echo "📝 Información del deployment:"
echo "   - Droplet ID: $DROPLET_ID"
echo "   - Droplet IP: $DROPLET_IP"
echo "   - Database ID: $DB_ID"
echo "   - Database Host: $DB_HOST"
echo "   - Load Balancer ID: $LB_ID"
echo "   - Load Balancer IP: $LB_IP"
echo "   - Domain: $DOMAIN"
echo ""
echo "🔗 URLs:"
echo "   - Frontend: https://${DOMAIN}"
echo "   - API: https://${DOMAIN}/api"
echo "   - Health: https://${DOMAIN}/health"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configurar secrets en GitHub Actions:"
echo "      - DO_REGISTRY_USERNAME"
echo "      - DO_REGISTRY_TOKEN"
echo "      - DO_REGISTRY_NAME"
echo "      - DO_SSH_PRIVATE_KEY"
echo "      - DO_DROPLET_IP: $DROPLET_IP"
echo "      - DOMAIN: $DOMAIN"
echo "   2. Verificar DNS apunta a: $LB_IP"
echo "   3. Revisar .env en el servidor: /var/www/$CLIENT_NAME/.env"
echo "   4. Configurar CI/CD en GitHub Actions"

