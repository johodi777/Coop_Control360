# Quick Start - DigitalOcean Deployment

Guía rápida para desplegar en DigitalOcean en 10 minutos.

## 🚀 Inicio Rápido

### 1. Prerrequisitos (5 min)

```bash
# 1. Instalar doctl
# Linux
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# macOS
brew install doctl

# 2. Autenticar
doctl auth init
# Ingresar tu API Token de DigitalOcean

# 3. Crear Container Registry
doctl registry create coopcontrol-registry
doctl registry login
```

### 2. Deployment Automatizado (5 min)

```bash
# Dar permisos
chmod +x deployment/digitalocean/deploy-digitalocean.sh
chmod +x deployment/digitalocean/setup-server.sh

# Ejecutar deployment
./deployment/digitalocean/deploy-digitalocean.sh \
    clienteA \
    clienteA.com \
    dop_v1_tu_token_aqui
```

El script creará:
- ✅ Droplet (servidor)
- ✅ Managed Database
- ✅ Load Balancer
- ✅ DNS (si el dominio está en DigitalOcean)
- ✅ Configuración inicial

### 3. Configurar GitHub Actions (2 min)

1. Ir a tu repositorio en GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. Agregar estos secrets:

```
DO_REGISTRY_USERNAME = tu-email@example.com
DO_REGISTRY_TOKEN = (obtener con: doctl registry token create deploy-token --read-write)
DO_REGISTRY_NAME = coopcontrol-registry
DO_SSH_PRIVATE_KEY = (contenido de ~/.ssh/id_rsa)
DO_DROPLET_IP = (IP del droplet creado)
DO_SSH_USER = root
DOMAIN = clienteA.com
VITE_API_URL = https://clienteA.com/api
```

### 4. Primera Deployment (3 min)

```bash
# Hacer push a main o production
git push origin main

# O ejecutar manualmente desde GitHub Actions
```

## ✅ Verificar Deployment

```bash
# Health check
curl https://clienteA.com/health

# Ver logs
ssh root@<DROPLET_IP>
cd /var/www/clienteA
docker-compose logs -f
```

## 📋 Checklist Post-Deployment

- [ ] SSL funcionando (https://clienteA.com)
- [ ] API respondiendo (/api/health)
- [ ] Frontend cargando
- [ ] Database conectada
- [ ] Backups configurados
- [ ] CI/CD funcionando

## 🆘 Problemas Comunes

### "No se puede conectar al servidor"

```bash
# Verificar IP del droplet
doctl compute droplet list

# Verificar firewall
ssh root@<IP>
ufw status
```

### "SSL no funciona"

```bash
ssh root@<IP>
cd /var/www/clienteA
certbot certonly --nginx -d clienteA.com
docker-compose restart nginx
```

### "Database no conecta"

```bash
# Verificar credenciales en .env
# Verificar que el droplet puede acceder a la database
doctl databases connection <DB_ID>
```

## 📚 Documentación Completa

Ver `deployment/digitalocean/README.md` para guía detallada.

## 💰 Costos

- Droplet: ~$24/mes
- Database: ~$15/mes
- Load Balancer: ~$12/mes
- Registry: ~$5/mes
- **Total: ~$56/mes**

---

**¿Listo?** ¡Empieza con el paso 1! 🚀

