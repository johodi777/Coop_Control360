# 🚀 Guía Completa: Deployment en DigitalOcean

Guía paso a paso para subir tu código y desplegar en DigitalOcean.

---

## 📋 ÍNDICE

1. [Preparar el Repositorio](#1-preparar-el-repositorio)
2. [Subir a GitHub](#2-subir-a-github)
3. [Configurar DigitalOcean](#3-configurar-digitalocean)
4. [Configurar GitHub Secrets](#4-configurar-github-secrets)
5. [Deployment Inicial](#5-deployment-inicial)
6. [Verificar Deployment](#6-verificar-deployment)
7. [Próximos Pasos](#7-próximos-pasos)

---

## 1. PREPARAR EL REPOSITORIO

### 1.1 Verificar que tienes Git inicializado

```bash
# En la raíz del proyecto
cd "C:\Users\Jonathan\Desktop\Concorde Software\Portafolio\Proyectos_aplicativos\CoopControl 360\Aplicativo"

# Verificar si ya es un repositorio Git
git status
```

**Si NO es un repositorio Git:**
```bash
# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: CoopControl 360"
```

**Si YA es un repositorio Git:**
```bash
# Verificar cambios pendientes
git status

# Si hay cambios, agregarlos
git add .
git commit -m "Add DigitalOcean deployment configuration"
```

### 1.2 Crear archivo .gitignore (si no existe)

Verifica que tienes un `.gitignore` en la raíz del proyecto:

```bash
# Ver si existe
cat .gitignore
```

Si no existe, créalo con este contenido:

```
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads (no subir archivos de usuarios)
backend/uploads/*
!backend/uploads/.gitkeep

# Secrets
*.pem
*.key
*.crt
```

### 1.3 Verificar estructura del proyecto

Asegúrate de que tienes esta estructura:

```
Aplicativo/
├── .github/
│   └── workflows/
│       └── deploy.yml          ✅ Debe existir
├── backend/
│   ├── Dockerfile              ✅ Debe existir
│   ├── .dockerignore           ✅ Debe existir
│   └── ...
├── frontend/
│   ├── Dockerfile              ✅ Debe existir
│   ├── .dockerignore           ✅ Debe existir
│   └── ...
└── deployment/
    └── digitalocean/
        ├── deploy-digitalocean.sh  ✅ Debe existir
        └── ...
```

---

## 2. SUBIR A GITHUB

### 2.1 Crear repositorio en GitHub

1. Ve a [GitHub.com](https://github.com)
2. Click en **"+"** (arriba derecha) > **"New repository"**
3. Configuración:
   - **Repository name**: `coopcontrol360` (o el nombre que prefieras)
   - **Description**: "CoopControl 360 - Sistema de gestión para cooperativas"
   - **Visibility**: Private (recomendado) o Public
   - **NO marques** "Initialize with README" (ya tienes código)
4. Click en **"Create repository"**

### 2.2 Conectar tu repositorio local con GitHub

GitHub te mostrará comandos. Usa estos:

```bash
# En la raíz de tu proyecto (PowerShell o Git Bash)

# Agregar el repositorio remoto
# Reemplaza TU_USUARIO con tu usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/coopcontrol360.git

# Verificar que se agregó correctamente
git remote -v
```

### 2.3 Subir el código

```bash
# Cambiar a la rama main (si estás en otra)
git branch -M main

# Subir el código
git push -u origin main
```

**Si te pide autenticación:**
- Usa un **Personal Access Token** (no tu contraseña)
- Cómo crear uno: GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
- Permisos necesarios: `repo` (todos los permisos de repositorio)

---

## 3. CONFIGURAR DIGITALOCEAN

### 3.1 Crear cuenta y obtener API Token

1. Ve a [DigitalOcean.com](https://www.digitalocean.com)
2. Crea una cuenta (si no tienes)
3. Agrega método de pago
4. Genera API Token:
   - Ve a **API** > **Tokens/Keys**
   - Click en **"Generate New Token"**
   - Nombre: `coopcontrol-deploy`
   - Expiration: `No expiration` (o la fecha que prefieras)
   - Scope: **Write** (necesitas permisos completos)
   - Click en **"Generate Token"**
   - **⚠️ COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)
   - Guárdalo en un lugar seguro (ej: `dop_v1_abc123xyz...`)

### 3.2 Instalar doctl (CLI de DigitalOcean)

**En Windows (PowerShell como Administrador):**

```powershell
# Opción 1: Con Chocolatey (si lo tienes)
choco install doctl

# Opción 2: Descargar manualmente
# Ve a: https://github.com/digitalocean/doctl/releases
# Descarga: doctl-X.X.X-windows-amd64.zip
# Extrae y agrega a PATH
```

**O usar WSL (Windows Subsystem for Linux):**

```bash
# En WSL
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
doctl version
```

### 3.3 Autenticar doctl

```bash
# Reemplaza TU_TOKEN con el token que copiaste
doctl auth init -t TU_TOKEN

# Verificar
doctl account get
```

### 3.4 Crear Container Registry

```bash
# Crear registry (solo una vez, puede ser compartido entre proyectos)
doctl registry create coopcontrol-registry

# Login al registry
doctl registry login

# Verificar
doctl registry get
```

### 3.5 Agregar SSH Key a DigitalOcean

**Si NO tienes SSH key:**

```bash
# Generar SSH key
ssh-keygen -t rsa -b 4096 -C "tu-email@example.com"

# Presiona Enter para usar ubicación por defecto
# Ingresa una contraseña (o déjala vacía)
```

**Agregar a DigitalOcean:**

```bash
# Ver tu clave pública
cat ~/.ssh/id_rsa.pub

# Copiar todo el contenido (empieza con ssh-rsa...)

# Agregar a DigitalOcean
doctl compute ssh-key import my-key --public-key-file ~/.ssh/id_rsa.pub

# O hacerlo desde el panel web:
# Settings > Security > SSH Keys > Add SSH Key
```

---

## 4. CONFIGURAR GITHUB SECRETS

Los secrets son variables que GitHub Actions usará para conectarse a DigitalOcean.

### 4.1 Ir a la configuración de Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (arriba del repositorio)
3. En el menú lateral: **Secrets and variables** > **Actions**
4. Click en **"New repository secret"**

### 4.2 Agregar cada Secret

Agrega estos secrets uno por uno:

#### Secret 1: `DO_REGISTRY_USERNAME`
- **Name**: `DO_REGISTRY_USERNAME`
- **Value**: Tu email de DigitalOcean (el que usaste para registrarte)
- Click **"Add secret"**

#### Secret 2: `DO_REGISTRY_TOKEN`
- **Name**: `DO_REGISTRY_TOKEN`
- **Value**: Obtener con este comando:
  ```bash
  doctl registry token create deploy-token --read-write
  ```
  - Copia el token que muestra (ej: `dop_rt_abc123...`)
- Click **"Add secret"**

#### Secret 3: `DO_REGISTRY_NAME`
- **Name**: `DO_REGISTRY_NAME`
- **Value**: `coopcontrol-registry` (o el nombre que usaste)
- Click **"Add secret"**

#### Secret 4: `DO_SSH_PRIVATE_KEY`
- **Name**: `DO_SSH_PRIVATE_KEY`
- **Value**: Tu clave privada SSH:
  ```bash
  # En Windows (Git Bash o WSL)
  cat ~/.ssh/id_rsa
  ```
  - Copia TODO el contenido (incluye `-----BEGIN OPENSSH PRIVATE KEY-----` hasta `-----END OPENSSH PRIVATE KEY-----`)
- Click **"Add secret"**

#### Secret 5: `DO_DROPLET_IP`
- **Name**: `DO_DROPLET_IP`
- **Value**: Lo obtendrás después del deployment inicial (por ahora déjalo vacío o usa `placeholder`)
- Click **"Add secret"**

#### Secret 6: `DO_SSH_USER`
- **Name**: `DO_SSH_USER`
- **Value**: `root`
- Click **"Add secret"**

#### Secret 7: `DOMAIN`
- **Name**: `DOMAIN`
- **Value**: Tu dominio (ej: `clienteA.com` o `app.coopcontrol.com`)
- Click **"Add secret"**

#### Secret 8: `VITE_API_URL`
- **Name**: `VITE_API_URL`
- **Value**: `https://TU_DOMINIO.com/api` (reemplaza TU_DOMINIO)
- Click **"Add secret"**

### 4.3 Verificar Secrets

Deberías ver 8 secrets en la lista. Si falta alguno, agrégalo.

---

## 5. DEPLOYMENT INICIAL

Ahora vamos a crear los recursos en DigitalOcean y hacer el primer deployment.

### 5.1 Preparar el script de deployment

```bash
# En la raíz del proyecto
cd deployment/digitalocean

# Dar permisos de ejecución (en WSL o Linux)
chmod +x deploy-digitalocean.sh
chmod +x setup-server.sh
chmod +x health-check.sh
```

### 5.2 Ejecutar deployment automatizado

**⚠️ IMPORTANTE:** Reemplaza estos valores:
- `clienteA` = Nombre de tu cliente
- `clienteA.com` = Tu dominio
- `dop_v1_xxxxx` = Tu API Token de DigitalOcean

```bash
# Desde la raíz del proyecto
./deployment/digitalocean/deploy-digitalocean.sh \
    clienteA \
    clienteA.com \
    dop_v1_tu_token_aqui
```

**¿Qué hace este script?**
1. ✅ Crea un Droplet (servidor virtual)
2. ✅ Crea una Managed Database
3. ✅ Crea un Load Balancer
4. ✅ Configura DNS (si el dominio está en DigitalOcean)
5. ✅ Prepara el servidor
6. ✅ Configura SSL
7. ✅ Inicia los servicios

**Tiempo estimado:** 5-10 minutos

### 5.3 Si el script falla o prefieres hacerlo manual

Sigue estos pasos uno por uno:

#### Paso 1: Crear Droplet

```bash
doctl compute droplet create clienteA-droplet \
    --size s-2vcpu-4gb \
    --region nyc3 \
    --image docker-20-04 \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
    --wait
```

Obtener IP del droplet:
```bash
DROPLET_IP=$(doctl compute droplet list --format ID,PublicIPv4 --no-header | grep clienteA-droplet | awk '{print $2}')
echo $DROPLET_IP
```

#### Paso 2: Crear Managed Database

```bash
doctl databases create clienteA-db \
    --engine mysql \
    --size db-s-1vcpu-1gb \
    --region nyc3
```

Obtener credenciales:
```bash
DB_ID=$(doctl databases list --format ID,Name --no-header | grep clienteA-db | awk '{print $1}')
doctl databases connection $DB_ID
```

**Guarda estas credenciales:**
- Host
- Port
- User
- Password
- Database name

#### Paso 3: Preparar el servidor

```bash
# Copiar script de setup
scp deployment/digitalocean/setup-server.sh root@$DROPLET_IP:/tmp/

# Ejecutar en el servidor
ssh root@$DROPLET_IP "bash /tmp/setup-server.sh"
```

#### Paso 4: Configurar el proyecto en el servidor

```bash
# Crear directorios
ssh root@$DROPLET_IP "mkdir -p /var/www/clienteA/{backend,frontend,nginx/{ssl,logs},backups}"

# Copiar docker-compose
scp deployment/digitalocean/docker-compose.production.yml root@$DROPLET_IP:/var/www/clienteA/docker-compose.yml

# Copiar nginx config
scp deployment/digitalocean/nginx/nginx.conf root@$DROPLET_IP:/var/www/clienteA/nginx/nginx.conf

# Crear .env (editar con tus valores)
scp deployment/digitalocean/env.production.template root@$DROPLET_IP:/var/www/clienteA/.env
```

Editar .env en el servidor:
```bash
ssh root@$DROPLET_IP
nano /var/www/clienteA/.env
```

Actualizar estos valores:
- `DB_HOST` = Host de la database
- `DB_PORT` = Port de la database
- `DB_USER` = User de la database
- `DB_PASS` = Password de la database
- `DB_NAME` = Nombre de la database
- `APP_DOMAIN` = Tu dominio
- `VITE_API_URL` = https://tu-dominio.com/api
- `JWT_SECRET` = Generar uno aleatorio (48 caracteres)

Generar JWT_SECRET:
```bash
openssl rand -base64 48 | tr -d "=+/" | cut -c1-48
```

#### Paso 5: Configurar DNS

Si tu dominio está en DigitalOcean:
```bash
LB_IP=$(doctl compute load-balancer list --format IP --no-header | head -1)
doctl compute domain records create tu-dominio.com \
    --record-type A \
    --record-name clienteA \
    --record-data $LB_IP
```

Si tu dominio está en otro proveedor:
- Crea un registro **A** apuntando a la IP del Load Balancer
- Nombre: `clienteA` (o `@` para el dominio raíz)
- Valor: IP del Load Balancer

#### Paso 6: Configurar SSL

```bash
ssh root@$DROPLET_IP
cd /var/www/clienteA

# Iniciar nginx temporalmente
docker-compose up -d nginx

# Obtener certificado SSL
certbot certonly --nginx \
    -d clienteA.com \
    --non-interactive \
    --agree-tos \
    --email tu-email@example.com
```

#### Paso 7: Actualizar DO_DROPLET_IP en GitHub

1. Ve a GitHub > Settings > Secrets
2. Edita `DO_DROPLET_IP`
3. Cambia el valor a la IP del droplet que creaste
4. Guarda

### 5.4 Primera deployment desde GitHub Actions

Una vez que todo está configurado:

1. Ve a tu repositorio en GitHub
2. Click en **Actions** (arriba)
3. Click en **"Deploy to DigitalOcean"** (workflow)
4. Click en **"Run workflow"** (botón derecho)
5. Selecciona:
   - **Branch**: `main`
   - **Client name**: `clienteA`
   - **Environment**: `production`
6. Click en **"Run workflow"**

**¿Qué hace?**
1. ✅ Construye las imágenes Docker
2. ✅ Las sube al Container Registry
3. ✅ Se conecta al servidor
4. ✅ Hace pull de las imágenes
5. ✅ Reinicia los contenedores
6. ✅ Ejecuta migraciones
7. ✅ Verifica health check

**Tiempo estimado:** 5-10 minutos

Puedes ver el progreso en tiempo real en la pestaña **Actions**.

---

## 6. VERIFICAR DEPLOYMENT

### 6.1 Health Check Automático

```bash
# Desde tu máquina local
./deployment/digitalocean/health-check.sh clienteA.com
```

O manualmente:

```bash
# Verificar API
curl https://clienteA.com/health

# Debe responder: {"ok":true}
```

### 6.2 Verificar en el navegador

1. Abre `https://clienteA.com`
2. Debe cargar el frontend
3. Intenta hacer login

### 6.3 Verificar logs

```bash
ssh root@$DROPLET_IP
cd /var/www/clienteA

# Ver todos los logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 6.4 Verificar servicios

```bash
ssh root@$DROPLET_IP
cd /var/www/clienteA

# Ver estado de contenedores
docker-compose ps

# Debe mostrar todos los servicios como "Up"
```

---

## 7. PRÓXIMOS PASOS

### 7.1 Configurar Backups

Los backups ya están configurados automáticamente, pero verifica:

```bash
ssh root@$DROPLET_IP
crontab -l
# Debe mostrar el job de backup
```

### 7.2 Monitoreo

- **DigitalOcean Dashboard**: Monitorea uso de recursos
- **GitHub Actions**: Ve el historial de deployments
- **Logs**: Revisa periódicamente los logs

### 7.3 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en tu código
git add .
git commit -m "Descripción de cambios"
git push origin main

# 2. GitHub Actions se ejecutará automáticamente
# 3. El deployment se hará solo
```

### 7.4 Rollback (si algo sale mal)

```bash
ssh root@$DROPLET_IP
cd /var/www/clienteA

# Volver a una versión anterior
docker-compose pull
docker-compose up -d
```

---

## 🆘 TROUBLESHOOTING

### Problema: "Permission denied" al hacer push

**Solución:**
- Usa Personal Access Token en lugar de contraseña
- Verifica que tienes permisos en el repositorio

### Problema: "Cannot connect to server"

**Solución:**
```bash
# Verificar que el droplet existe
doctl compute droplet list

# Verificar IP
doctl compute droplet get <ID> --format PublicIPv4

# Verificar firewall
ssh root@<IP>
ufw status
```

### Problema: "SSL certificate error"

**Solución:**
```bash
ssh root@<IP>
cd /var/www/clienteA
certbot renew --force-renewal
docker-compose restart nginx
```

### Problema: "Database connection failed"

**Solución:**
- Verifica credenciales en `.env`
- Verifica que el droplet puede acceder a la database
- Verifica firewall de la database en DigitalOcean

### Problema: "GitHub Actions falla"

**Solución:**
1. Ve a Actions > Click en el workflow fallido
2. Revisa los logs para ver el error específico
3. Verifica que todos los secrets están configurados
4. Verifica que el servidor está accesible

---

## ✅ CHECKLIST FINAL

Antes de considerar el deployment completo:

- [ ] Código subido a GitHub
- [ ] Secrets configurados en GitHub
- [ ] Droplet creado y accesible
- [ ] Database creada y conectada
- [ ] DNS configurado
- [ ] SSL funcionando
- [ ] Frontend carga correctamente
- [ ] API responde correctamente
- [ ] Login funciona
- [ ] Backups configurados
- [ ] CI/CD funcionando

---

## 📞 AYUDA ADICIONAL

Si tienes problemas:

1. Revisa los logs: `docker-compose logs`
2. Ejecuta health check: `./health-check.sh`
3. Verifica secrets en GitHub
4. Revisa la documentación en `deployment/digitalocean/README.md`

---

**¡Felicitaciones! 🎉 Tu aplicación está desplegada en producción.**

