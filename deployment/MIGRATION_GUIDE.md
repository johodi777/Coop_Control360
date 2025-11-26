# Guía de Migración: SaaS Multi-tenant a Deployment Independiente por Cliente

Esta guía te ayudará a migrar de un sistema SaaS multi-tenant (donde múltiples clientes comparten la misma instalación) a deployments independientes (una instalación por cliente).

## 📋 Tabla de Contenidos

1. [Evaluación Inicial](#1-evaluación-inicial)
2. [Preparación](#2-preparación)
3. [Migración de Datos](#3-migración-de-datos)
4. [Migración de Archivos](#4-migración-de-archivos)
5. [Deployment](#5-deployment)
6. [Pruebas](#6-pruebas)
7. [Cutover](#7-cutover)
8. [Checklist Final](#8-checklist-final)

---

## 1. Evaluación Inicial

### 1.1 Verificar Estructura Multi-tenant Actual

**Cómo manejas el multi-tenant:**

- ✅ **Opción A**: Una sola BD con columna `cooperativeId` (tu caso actual)
- ⬜ Opción B: BD separadas por cliente

**Dónde guardas los archivos:**

- ✅ Carpeta `/uploads` (sin separación por cooperativa)
- ⬜ S3 u otro almacenamiento en la nube
- ⬜ Base de datos

**Lógica que depende de `cooperativeId`:**

- ✅ Filtros en queries de afiliados (`WHERE cooperativeId = ?`)
- ✅ Relaciones entre tablas a través de `cooperativeId`

### 1.2 Verificar Configuración Actual

```bash
# Revisar .env actual
cat backend/.env

# Verificar estructura de BD
mysql -u root -p -e "USE coopcontrol; SHOW TABLES;"
mysql -u root -p -e "USE coopcontrol; DESCRIBE affiliates;"
```

### 1.3 Identificar Clientes a Migrar

```sql
-- Listar todas las cooperativas
SELECT id, name, nit, email FROM cooperatives WHERE isActive = 1;
```

---

## 2. Preparación

### 2.1 Crear Estructura de Directorios

```bash
# En tu servidor de deployment
mkdir -p /var/www/{clienteA,clienteB,clienteC}
```

### 2.2 Preparar Scripts de Migración

Los scripts ya están creados en:
- `backend/scripts/migrate-client-data.js` - Migración de datos
- `backend/scripts/migrate-client-files.js` - Migración de archivos

### 2.3 Backup Completo del Sistema Original

```bash
# Backup de BD completa
mysqldump -u root -p coopcontrol > backup_completo_$(date +%Y%m%d).sql

# Backup de archivos
tar -czf backup_uploads_$(date +%Y%m%d).tar.gz backend/uploads/
```

---

## 3. Migración de Datos

### 3.1 Exportar Datos del Cliente

Para cada cliente, ejecuta el script de migración:

```bash
cd backend

# Ejemplo: Migrar cooperativa ID 5 a BD clienteA_db
node scripts/migrate-client-data.js 5 clienteA_db
```

**El script hará:**
1. Crear nueva base de datos `clienteA_db`
2. Copiar estructuras de todas las tablas
3. Migrar datos de la cooperativa específica
4. Migrar datos relacionados (afiliados, facturas, transacciones, etc.)

### 3.2 Verificar Migración

```bash
# Conectar a la nueva BD
mysql -u root -p clienteA_db

# Verificar datos
SELECT COUNT(*) as total_afiliados FROM affiliates;
SELECT COUNT(*) as total_facturas FROM invoices;
SELECT COUNT(*) as total_transacciones FROM transactions;
```

### 3.3 Notas Importantes

- **Usuarios**: Se migran TODOS los usuarios (asumiendo que todos pueden acceder)
- **Roles**: Se migran todos los roles del sistema
- **Settings**: Se migran todas las configuraciones
- **Servicios**: Si tienen `cooperativeId`, se filtran; si no, se migran todos

---

## 4. Migración de Archivos

### 4.1 Exportar Archivos del Cliente

```bash
cd backend

# Ejemplo: Migrar archivos de cooperativa ID 5 a /var/www/clienteA/uploads
node scripts/migrate-client-files.js 5 /var/www/clienteA/uploads
```

**El script hará:**
1. Buscar referencias de archivos en la BD
2. Localizar archivos en `/uploads`
3. Copiar archivos al directorio destino

### 4.2 Verificar Archivos Migrados

```bash
# Verificar cantidad de archivos
ls -la /var/www/clienteA/uploads/ | wc -l

# Verificar tamaño total
du -sh /var/www/clienteA/uploads/
```

---

## 5. Deployment

### 5.1 Configurar Variables de Entorno

```bash
# Copiar template
cp deployment/env.template /var/www/clienteA/.env

# Editar .env
nano /var/www/clienteA/.env
```

**Valores importantes a configurar:**
- `CLIENT_NAME=clienteA`
- `DB_NAME=clienteA_db`
- `DB_PASS=<password_segura>`
- `DB_ROOT_PASSWORD=<password_segura>`
- `JWT_SECRET=<secret_aleatorio_48_chars>`
- `APP_DOMAIN=clienteA.com`
- `APP_URL=https://clienteA.com`

### 5.2 Deployment Automatizado

```bash
# Usar script de deployment
chmod +x deployment/deploy-cliente.sh

./deploy-cliente.sh clienteA clienteA.com ~/.ssh/id_rsa
```

**El script hará:**
1. Crear estructura de directorios
2. Instalar Docker y Docker Compose
3. Copiar archivos del proyecto
4. Configurar .env
5. Construir y levantar contenedores
6. Ejecutar migraciones
7. Configurar SSL con Let's Encrypt
8. Configurar backups automáticos

### 5.3 Deployment Manual (Alternativa)

Si prefieres hacerlo manualmente:

```bash
# 1. Copiar archivos
cp -r backend /var/www/clienteA/
cp -r frontend /var/www/clienteA/
cp deployment/docker-compose.client.yml /var/www/clienteA/docker-compose.yml
cp deployment/nginx/nginx.conf /var/www/clienteA/nginx/nginx.conf

# 2. Configurar .env
cp deployment/env.template /var/www/clienteA/.env
# Editar .env con valores correctos

# 3. Levantar servicios
cd /var/www/clienteA
docker-compose up -d

# 4. Ejecutar migraciones
docker-compose exec backend npm run migrate

# 5. Configurar SSL
certbot --nginx -d clienteA.com
```

---

## 6. Pruebas

### 6.1 Verificar Servicios

```bash
# Verificar que los contenedores están corriendo
docker-compose -f /var/www/clienteA/docker-compose.yml ps

# Verificar logs
docker-compose -f /var/www/clienteA/docker-compose.yml logs backend
docker-compose -f /var/www/clienteA/docker-compose.yml logs frontend
```

### 6.2 Pruebas de API

```bash
# Health check
curl https://clienteA.com/health

# Login de prueba
curl -X POST https://clienteA.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 6.3 Pruebas de Frontend

1. Abrir `https://clienteA.com` en el navegador
2. Verificar que carga sin errores
3. Intentar login
4. Verificar que los datos se muestran correctamente
5. Probar subida de archivos

### 6.4 Verificar Archivos

```bash
# Verificar que los archivos se cargan
curl https://clienteA.com/uploads/archivo_ejemplo.pdf
```

### 6.5 Verificar SSL

```bash
# Verificar certificado
openssl s_client -connect clienteA.com:443 -servername clienteA.com
```

---

## 7. Cutover

### 7.1 Plan de Cutover

**Antes del cutover:**
1. ✅ Notificar al cliente sobre el cambio
2. ✅ Programar ventana de mantenimiento
3. ✅ Preparar rollback plan

**Durante el cutover:**
1. Poner sistema original en modo "solo lectura" (opcional)
2. Exportar datos finales del día
3. Importar datos finales en nueva instancia
4. Validar que todo funciona
5. Cambiar DNS para apuntar al nuevo servidor
6. Deshabilitar acceso multi-tenant del cliente en sistema original

### 7.2 Script de Cutover

```bash
#!/bin/bash
# cutover-cliente.sh

CLIENT_NAME=$1
COOPERATIVE_ID=$2

echo "🔄 Iniciando cutover para ${CLIENT_NAME}..."

# 1. Exportar datos finales
node backend/scripts/migrate-client-data.js ${COOPERATIVE_ID} ${CLIENT_NAME}_db_final

# 2. Importar en nueva instancia
# (usar mysqldump y mysql para importar)

# 3. Verificar
curl -f https://${CLIENT_NAME}.com/health || exit 1

# 4. Notificar
echo "✅ Cutover completado para ${CLIENT_NAME}"
```

### 7.3 Deshabilitar Cliente en Sistema Original

```sql
-- Marcar cooperativa como inactiva en sistema original
UPDATE cooperatives SET isActive = 0 WHERE id = 5;

-- O eliminar datos (CUIDADO: solo si estás seguro)
-- DELETE FROM affiliates WHERE cooperativeId = 5;
```

---

## 8. Checklist Final

### 8.1 Servidor Independiente

- [ ] Servidor creado y configurado
- [ ] Docker y Docker Compose instalados
- [ ] Estructura de directorios creada
- [ ] Permisos configurados correctamente

### 8.2 Base de Datos

- [ ] Base de datos creada
- [ ] Datos migrados y verificados
- [ ] Usuarios migrados
- [ ] Relaciones preservadas
- [ ] Índices creados correctamente

### 8.3 Configuración

- [ ] `.env` configurado con valores correctos
- [ ] Passwords seguros generados
- [ ] JWT_SECRET único por cliente
- [ ] URLs y dominios configurados

### 8.4 Archivos

- [ ] Archivos migrados
- [ ] Permisos correctos en `/uploads`
- [ ] Archivos accesibles vía web

### 8.5 SSL y Seguridad

- [ ] Certificado SSL activo
- [ ] HTTPS funcionando
- [ ] Headers de seguridad configurados
- [ ] Firewall configurado

### 8.6 Backups

- [ ] Backups automáticos configurados
- [ ] Script de backup funcionando
- [ ] Crontab configurado
- [ ] Retención de backups configurada

### 8.7 Funcionalidad

- [ ] API respondiendo correctamente
- [ ] Frontend cargando sin errores
- [ ] Login funcionando
- [ ] Datos mostrándose correctamente
- [ ] Subida de archivos funcionando
- [ ] Pagos funcionando (si aplica)

### 8.8 Monitoreo

- [ ] Logs configurados
- [ ] Health checks funcionando
- [ ] Alertas configuradas (opcional)

### 8.9 Cliente

- [ ] Cliente notificado
- [ ] Credenciales proporcionadas
- [ ] Documentación entregada
- [ ] Soporte disponible

### 8.10 Sistema Original

- [ ] Cliente deshabilitado en multi-tenant
- [ ] Datos respaldados
- [ ] Acceso revocado

---

## 🚨 Troubleshooting

### Problema: Base de datos no se crea

**Solución:**
```bash
# Verificar permisos de MySQL
mysql -u root -p -e "GRANT ALL PRIVILEGES ON *.* TO 'coop'@'%';"
```

### Problema: Archivos no se copian

**Solución:**
```bash
# Verificar permisos
chmod -R 755 /var/www/clienteA/uploads
chown -R www-data:www-data /var/www/clienteA/uploads
```

### Problema: SSL no se configura

**Solución:**
```bash
# Configurar manualmente
certbot --nginx -d clienteA.com --non-interactive --agree-tos
```

### Problema: Contenedores no inician

**Solución:**
```bash
# Ver logs
docker-compose logs

# Reconstruir
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs: `docker-compose logs`
2. Verifica la configuración: `.env`
3. Consulta esta guía
4. Contacta al equipo de desarrollo

---

## 🎯 Resultado Final

Después de completar la migración, cada cliente tendrá:

✅ Su propio servidor independiente  
✅ Su propia base de datos  
✅ Su propia instalación  
✅ Cero riesgo de mezclar datos  
✅ Máxima seguridad  
✅ Escalabilidad por cliente  
✅ Control absoluto del SLA  

---

**Última actualización:** $(date +%Y-%m-%d)

