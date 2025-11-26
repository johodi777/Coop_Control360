# Deployment en DigitalOcean - Guía Completa

Esta guía te ayudará a desplegar CoopControl 360 en DigitalOcean con:
- ✅ Docker y Container Registry
- ✅ CI/CD con GitHub Actions
- ✅ SSL automático
- ✅ Load Balancer
- ✅ Managed Database
- ✅ Backups automáticos

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Crear Recursos en DigitalOcean](#crear-recursos-en-digitalocean)
4. [Configurar CI/CD](#configurar-cicd)
5. [Deployment Automatizado](#deployment-automatizado)
6. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## Prerrequisitos

### 1. Cuenta de DigitalOcean

- Crear cuenta en [DigitalOcean](https://www.digitalocean.com)
- Agregar método de pago
- Generar API Token: **API** > **Tokens/Keys** > **Generate New Token**

### 2. GitHub Repository

- Código en GitHub
- Acceso para configurar Secrets y Actions

### 3. Dominio

- Dominio registrado
- Acceso a configuración DNS

### 4. Herramientas Locales

```bash
# Instalar doctl (CLI de DigitalOcean)
# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# macOS
brew install doctl

# Verificar
doctl version
```

---

## Configuración Inicial

### 1. Autenticar con DigitalOcean

```bash
doctl auth init
# Ingresar tu API Token
```

### 2. Crear Container Registry

```bash
# Crear registry
doctl registry create coopcontrol-registry

# Login
doctl registry login
```

### 3. Configurar SSH Key

```bash
# Si no tienes SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Agregar a DigitalOcean
doctl compute ssh-key import my-key --public-key-file ~/.ssh/id_rsa.pub
```

---

## Crear Recursos en DigitalOcean

### Opción A: Script Automatizado

```bash
chmod +x deployment/digitalocean/deploy-digitalocean.sh
./deployment/digitalocean/deploy-digitalocean.sh clienteA clienteA.com dop_v1_xxxxx
```

### Opción B: Manual

#### 1. Crear Droplet

```bash
doctl compute droplet create clienteA-droplet \
    --size s-2vcpu-4gb \
    --region nyc3 \
    --image docker-20-04 \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
    --wait
```

#### 2. Crear Managed Database

```bash
doctl databases create clienteA-db \
    --engine mysql \
    --size db-s-1vcpu-1gb \
    --region nyc3
```

Obtener credenciales:
```bash
doctl databases connection <DB_ID>
```

#### 3. Crear Load Balancer

```bash
DROPLET_ID=$(doctl compute droplet list --format ID --no-header | head -1)

doctl compute load-balancer create \
    --name clienteA-lb \
    --region nyc3 \
    --forwarding-rules "entry_protocol:http,entry_port:80,target_protocol:http,target_port:80" \
    --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:80" \
    --health-check protocol:http,port:80,path:/health \
    --droplet-ids $DROPLET_ID
```

#### 4. Configurar DNS

```bash
# Obtener IP del Load Balancer
LB_IP=$(doctl compute load-balancer get <LB_ID> --format IP --no-header)

# Crear registro A
doctl compute domain records create example.com \
    --record-type A \
    --record-name clienteA \
    --record-data $LB_IP \
    --record-ttl 300
```

---

## Configurar CI/CD

### 1. Configurar GitHub Secrets

En tu repositorio de GitHub: **Settings** > **Secrets and variables** > **Actions**

Agregar los siguientes secrets:

```
DO_REGISTRY_USERNAME          # Usuario del registry (tu email)
DO_REGISTRY_TOKEN             # Token del registry
DO_REGISTRY_NAME              # Nombre del registry (ej: coopcontrol-registry)
DO_SSH_PRIVATE_KEY            # Clave privada SSH para acceso al servidor
DO_DROPLET_IP                 # IP del Droplet
DO_SSH_USER                   # Usuario SSH (root)
DOMAIN                        # Dominio (ej: clienteA.com)
VITE_API_URL                  # URL de la API (ej: https://clienteA.com/api)
SLACK_WEBHOOK_URL             # (Opcional) Webhook de Slack para notificaciones
```

### 2. Obtener Registry Token

```bash
# Generar token de lectura/escritura
doctl registry token create deploy-token --read-write

# El token se mostrará, copiarlo a DO_REGISTRY_TOKEN
```

### 3. Configurar SSH Key en GitHub

```bash
# Copiar clave privada
cat ~/.ssh/id_rsa
# Copiar todo el contenido a DO_SSH_PRIVATE_KEY
```

### 4. Verificar Workflow

El workflow está en `.github/workflows/deploy.yml`

Se ejecuta automáticamente cuando:
- Push a `main` o `production`
- Manualmente desde GitHub Actions

---

## Deployment Automatizado

### 1. Primera Vez (Setup Inicial)

```bash
# Conectar al servidor
ssh root@<DROPLET_IP>

# Crear estructura
mkdir -p /var/www/clienteA/{backend,frontend,nginx/{ssl,logs},backups}

# Copiar docker-compose
scp deployment/digitalocean/docker-compose.production.yml root@<DROPLET_IP>:/var/www/clienteA/docker-compose.yml

# Copiar nginx config
scp deployment/digitalocean/nginx/nginx.conf root@<DROPLET_IP>:/var/www/clienteA/nginx/nginx.conf

# Crear .env
scp deployment/digitalocean/env.production.template root@<DROPLET_IP>:/var/www/clienteA/.env
# Editar .env con valores correctos
```

### 2. Configurar SSL

```bash
ssh root@<DROPLET_IP>
cd /var/www/clienteA

# Iniciar nginx temporalmente
docker-compose up -d nginx

# Obtener certificado
certbot certonly --nginx \
    -d clienteA.com \
    --non-interactive \
    --agree-tos \
    --email admin@clienteA.com
```

### 3. Deployment Automático

Una vez configurado, cada push a `main` o `production`:

1. GitHub Actions construye las imágenes Docker
2. Las sube al Container Registry
3. Se conecta al servidor vía SSH
4. Hace pull de las nuevas imágenes
5. Reinicia los contenedores
6. Ejecuta migraciones
7. Verifica health check

### 4. Deployment Manual

```bash
# Desde el servidor
cd /var/www/clienteA
docker-compose pull
docker-compose up -d --no-deps --build backend frontend
docker-compose exec -T backend npm run migrate
```

---

## Monitoreo y Mantenimiento

### 1. Ver Logs

```bash
# Todos los servicios
docker-compose -f /var/www/clienteA/docker-compose.yml logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 2. Health Checks

```bash
# API
curl https://clienteA.com/health

# Frontend
curl -I https://clienteA.com
```

### 3. Backups

Los backups están configurados para ejecutarse diariamente a las 2 AM.

**Backup Manual:**
```bash
ssh root@<DROPLET_IP>
cd /var/www/clienteA
./backup.sh
```

**Backup de Database:**
```bash
# Desde DigitalOcean Dashboard
# Databases > Tu Database > Backups

# O desde CLI
doctl databases backup create <DB_ID> --backup-name manual-backup
```

### 4. Escalar Servicios

**Aumentar réplicas de backend:**
```bash
cd /var/www/clienteA
docker-compose up -d --scale backend=3
```

**Actualizar Load Balancer:**
```bash
# Agregar más droplets al load balancer
doctl compute load-balancer update <LB_ID> \
    --droplet-ids <DROPLET_ID_1>,<DROPLET_ID_2>,<DROPLET_ID_3>
```

### 5. Renovación de SSL

Certbot está configurado para renovar automáticamente. Verificar:

```bash
docker-compose logs certbot
```

### 6. Actualizar Base de Datos

```bash
# Desde DigitalOcean Dashboard
# Databases > Tu Database > Settings > Resize

# O desde CLI
doctl databases resize <DB_ID> --size db-s-2vcpu-2gb
```

---

## Troubleshooting

### Problema: Imágenes no se construyen

**Solución:**
- Verificar secrets de GitHub
- Verificar permisos del registry token
- Revisar logs de GitHub Actions

### Problema: Deployment falla

**Solución:**
```bash
# Verificar conexión SSH
ssh root@<DROPLET_IP>

# Verificar que el servidor puede hacer pull
docker login registry.digitalocean.com
docker pull registry.digitalocean.com/registry/coopcontrol-backend:latest
```

### Problema: SSL no funciona

**Solución:**
```bash
# Verificar certificado
certbot certificates

# Renovar manualmente
certbot renew --force-renewal
```

### Problema: Load Balancer no responde

**Solución:**
- Verificar que los droplets están en el load balancer
- Verificar health checks
- Verificar reglas de forwarding

---

## Costos Estimados

**Por cliente (mensual):**
- Droplet (s-2vcpu-4gb): ~$24/mes
- Managed Database (db-s-1vcpu-1gb): ~$15/mes
- Load Balancer: ~$12/mes
- Container Registry (5GB): ~$5/mes
- **Total: ~$56/mes por cliente**

**Opciones de ahorro:**
- Usar droplets más pequeños para desarrollo
- Compartir registry entre clientes
- Usar database más pequeña si el volumen es bajo

---

## Seguridad

### 1. Firewall

```bash
# En el droplet
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Secrets

- Nunca commitear `.env` al repositorio
- Usar GitHub Secrets para valores sensibles
- Rotar tokens regularmente

### 3. Database

- Usar Managed Database (SSL automático)
- Restringir acceso por IP si es posible
- Hacer backups regulares

---

## Próximos Pasos

1. ✅ Configurar monitoreo (opcional: Datadog, New Relic)
2. ✅ Configurar alertas (Slack, Email)
3. ✅ Configurar CDN (Cloudflare) para archivos estáticos
4. ✅ Implementar blue-green deployment
5. ✅ Configurar auto-scaling

---

**Última actualización:** 2024-01-XX

