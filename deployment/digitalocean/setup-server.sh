#!/bin/bash

# Script para preparar el servidor Droplet en DigitalOcean
# Ejecutar en el servidor después de crearlo

set -e

echo "🔧 Preparando servidor para CoopControl 360..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt-get update
apt-get upgrade -y

# Instalar herramientas básicas
echo "📦 Instalando herramientas..."
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    certbot \
    python3-certbot-nginx \
    htop \
    nano \
    unzip

# Instalar Docker (si no está instalado)
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose (si no está instalado)
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Instalar doctl (CLI de DigitalOcean)
if ! command -v doctl &> /dev/null; then
    echo "📦 Instalando doctl..."
    cd ~
    wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
    tar xf doctl-1.94.0-linux-amd64.tar.gz
    mv doctl /usr/local/bin
    rm doctl-1.94.0-linux-amd64.tar.gz
fi

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configurar límites del sistema
echo "⚙️  Configurando límites del sistema..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# Configurar sysctl para mejor rendimiento
cat >> /etc/sysctl.conf << EOF
# Network performance
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535

# Connection tracking
net.netfilter.nf_conntrack_max = 262144
EOF

sysctl -p

# Crear usuario para deployment (opcional, más seguro que root)
echo "👤 Creando usuario de deployment..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy
    
    # Configurar sudo sin password para deploy
    echo "deploy ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
fi

# Configurar swap (si no existe)
if [ ! -f /swapfile ]; then
    echo "💾 Configurando swap..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Configurar logrotate para Docker
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Optimizar Docker
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

echo ""
echo "✅ Servidor preparado exitosamente!"
echo ""
echo "📋 Información:"
echo "   - Docker: $(docker --version)"
echo "   - Docker Compose: $(docker-compose --version)"
echo "   - doctl: $(doctl version)"
echo ""
echo "🔐 Próximos pasos:"
echo "   1. Autenticar doctl: doctl auth init"
echo "   2. Login al registry: doctl registry login"
echo "   3. Crear estructura de directorios para la aplicación"
echo "   4. Configurar .env"
echo "   5. Iniciar servicios con docker-compose"

