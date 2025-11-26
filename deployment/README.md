# Deployment Independiente por Cliente - CoopControl 360

Este directorio contiene todos los archivos y scripts necesarios para migrar de un sistema SaaS multi-tenant a deployments independientes (una instalación por cliente).

## 📁 Estructura

```
deployment/
├── README.md                    # Este archivo
├── MIGRATION_GUIDE.md           # Guía completa de migración
├── EVALUATION_SCRIPT.md         # Script de evaluación inicial
├── BACKEND_SINGLE_TENANT.md     # Modificaciones opcionales del backend
├── deploy-cliente.sh            # Script de deployment automatizado
├── docker-compose.client.yml    # Docker Compose para cliente individual
├── env.template                 # Template de variables de entorno
└── nginx/
    └── nginx.conf               # Configuración Nginx para cliente individual
```

## 🚀 Inicio Rápido

### 1. Evaluación Inicial

Lee primero `EVALUATION_SCRIPT.md` para evaluar tu sistema actual.

### 2. Migración de Datos

```bash
# Migrar datos de una cooperativa a nueva BD
cd backend
node scripts/migrate-client-data.js <cooperativeId> <newDbName>

# Ejemplo
node scripts/migrate-client-data.js 5 clienteA_db
```

### 3. Migración de Archivos

```bash
# Migrar archivos relacionados con una cooperativa
node scripts/migrate-client-files.js <cooperativeId> <targetPath>

# Ejemplo
node scripts/migrate-client-files.js 5 /var/www/clienteA/uploads
```

### 4. Deployment Automatizado

```bash
# Dar permisos de ejecución
chmod +x deployment/deploy-cliente.sh

# Ejecutar deployment
./deployment/deploy-cliente.sh clienteA clienteA.com ~/.ssh/id_rsa
```

## 📚 Documentación

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía completa paso a paso
- **[EVALUATION_SCRIPT.md](./EVALUATION_SCRIPT.md)** - Cómo evaluar tu sistema actual
- **[BACKEND_SINGLE_TENANT.md](./BACKEND_SINGLE_TENANT.md)** - Modificaciones opcionales del backend

## 📋 Checklist de Migración

### Antes de Empezar

- [ ] Backup completo del sistema original
- [ ] Evaluación inicial completada
- [ ] Servidor de destino preparado
- [ ] Scripts de migración probados

### Durante la Migración

- [ ] Datos migrados a nueva BD
- [ ] Archivos migrados
- [ ] Variables de entorno configuradas
- [ ] Servicios desplegados y funcionando
- [ ] SSL configurado
- [ ] Backups automáticos configurados

### Después de la Migración

- [ ] Pruebas completadas
- [ ] Cliente notificado
- [ ] Cutover realizado
- [ ] Cliente deshabilitado en sistema original

## 🛠️ Scripts Disponibles

### Scripts de Migración

1. **migrate-client-data.js**
   - Exporta datos de una cooperativa a nueva BD
   - Ubicación: `backend/scripts/migrate-client-data.js`

2. **migrate-client-files.js**
   - Copia archivos relacionados con una cooperativa
   - Ubicación: `backend/scripts/migrate-client-files.js`

### Scripts de Deployment

1. **deploy-cliente.sh**
   - Deployment automatizado completo
   - Instala Docker, configura servicios, SSL, backups
   - Ubicación: `deployment/deploy-cliente.sh`

## 🔧 Configuración

### Variables de Entorno

Copia `env.template` a `/var/www/<cliente>/.env` y configura:

- `CLIENT_NAME` - Nombre del cliente
- `DB_NAME` - Nombre de la base de datos
- `DB_PASS` - Password de BD (generar seguro)
- `JWT_SECRET` - Secret para JWT (generar aleatorio)
- `APP_DOMAIN` - Dominio del cliente
- `APP_URL` - URL completa

### Docker Compose

El archivo `docker-compose.client.yml` define:
- MySQL database
- Backend API
- Frontend Web
- Nginx reverse proxy

### Nginx

Configuración en `nginx/nginx.conf`:
- SSL/TLS
- Rate limiting
- Proxy para API y Frontend
- Servir archivos estáticos

## 🔒 Seguridad

### SSL/TLS

El script de deployment configura automáticamente SSL con Let's Encrypt.

Si necesitas configurar manualmente:

```bash
certbot --nginx -d clienteA.com
```

### Passwords

El script genera passwords aleatorios, pero **debes revisarlos** en `.env` y cambiarlos si es necesario.

### Firewall

Asegúrate de configurar el firewall del servidor:

```bash
# Permitir HTTP, HTTPS, SSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

## 💾 Backups

Los backups automáticos están configurados para ejecutarse diariamente a las 2 AM.

Incluyen:
- Base de datos (mysqldump)
- Archivos de uploads

Retención: 30 días

## 🐛 Troubleshooting

### Problemas Comunes

1. **Contenedores no inician**
   ```bash
   docker-compose logs
   docker-compose down
   docker-compose up -d
   ```

2. **SSL no se configura**
   ```bash
   certbot --nginx -d clienteA.com --non-interactive
   ```

3. **Archivos no se cargan**
   ```bash
   chmod -R 755 /var/www/clienteA/uploads
   chown -R www-data:www-data /var/www/clienteA/uploads
   ```

### Ver Logs

```bash
# Todos los servicios
docker-compose -f /var/www/clienteA/docker-compose.yml logs

# Servicio específico
docker-compose -f /var/www/clienteA/docker-compose.yml logs backend
docker-compose -f /var/www/clienteA/docker-compose.yml logs frontend
```

## 📞 Soporte

Para problemas o preguntas:

1. Revisa la documentación en este directorio
2. Verifica los logs de los servicios
3. Consulta `MIGRATION_GUIDE.md` para pasos detallados

## 🎯 Resultado Final

Después de completar la migración, cada cliente tendrá:

✅ Servidor independiente  
✅ Base de datos propia  
✅ Instalación propia  
✅ SSL activo  
✅ Backups automáticos  
✅ Cero riesgo de mezclar datos  
✅ Máxima seguridad  

---

**Última actualización:** 2024-01-XX

