# 🚀 Deployment en DigitalOcean - Índice Principal

Bienvenido a la documentación completa para desplegar CoopControl 360 en DigitalOcean con arquitectura de producción.

## 📚 Documentación Disponible

### 1. [QUICK_START.md](./QUICK_START.md) ⚡
**Inicio rápido en 10 minutos**
- Setup básico
- Deployment automatizado
- Configuración inicial

### 2. [README.md](./README.md) 📖
**Guía completa y detallada**
- Prerrequisitos
- Configuración paso a paso
- CI/CD con GitHub Actions
- Monitoreo y mantenimiento
- Troubleshooting

### 3. [database-setup.sql](./database-setup.sql) 🗄️
**Script de setup de base de datos**
- Crear base de datos
- Configurar usuarios
- Verificaciones

### 4. [health-check.sh](./health-check.sh) 🏥
**Script de verificación de salud**
- Health checks automáticos
- Verificación de SSL
- Verificación de DNS
- Métricas de rendimiento

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         DigitalOcean Load Balancer      │
│         (SSL Termination)               │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
   ┌───▼───┐      ┌───▼───┐
   │Nginx  │      │Nginx  │
   │Proxy  │      │Proxy  │
   └───┬───┘      └───┬───┘
       │               │
   ┌───▼───┐      ┌───▼───┐
   │Backend│      │Backend│
   │(API)  │      │(API)  │
   └───┬───┘      └───┬───┘
       │               │
       └───────┬───────┘
               │
   ┌───────────▼───────────┐
   │  Managed Database      │
   │  (MySQL/PostgreSQL)    │
   └────────────────────────┘
```

## 🎯 Características

✅ **Docker & Container Registry**
- Imágenes optimizadas
- Build automático
- Versionado de imágenes

✅ **CI/CD con GitHub Actions**
- Deployment automático
- Build y push de imágenes
- Rollback automático en caso de error

✅ **Load Balancing**
- Balanceo de carga con Nginx
- Health checks
- Failover automático

✅ **SSL/TLS**
- Certificados Let's Encrypt
- Renovación automática
- A+ SSL rating

✅ **Managed Database**
- Backups automáticos
- Alta disponibilidad
- SSL/TLS encriptado

✅ **Monitoreo**
- Health checks
- Logs centralizados
- Métricas de rendimiento

## 📋 Checklist de Deployment

### Pre-Deployment
- [ ] Cuenta de DigitalOcean creada
- [ ] API Token generado
- [ ] Container Registry creado
- [ ] SSH Key agregado
- [ ] Dominio configurado

### Deployment
- [ ] Droplet creado
- [ ] Managed Database creada
- [ ] Load Balancer configurado
- [ ] DNS apuntando al Load Balancer
- [ ] SSL configurado
- [ ] Servicios desplegados

### Post-Deployment
- [ ] Health checks pasando
- [ ] SSL funcionando
- [ ] API respondiendo
- [ ] Frontend cargando
- [ ] Backups configurados
- [ ] CI/CD funcionando

## 🛠️ Scripts Disponibles

1. **deploy-digitalocean.sh**
   - Deployment completo automatizado
   - Crea todos los recursos necesarios

2. **setup-server.sh**
   - Preparar servidor Droplet
   - Instalar dependencias
   - Configurar firewall

3. **health-check.sh**
   - Verificar estado del deployment
   - Health checks completos

## 💰 Costos Estimados

**Por cliente (mensual):**
- Droplet (s-2vcpu-4gb): ~$24/mes
- Managed Database (db-s-1vcpu-1gb): ~$15/mes
- Load Balancer: ~$12/mes
- Container Registry (5GB): ~$5/mes
- **Total: ~$56/mes**

## 🚀 Inicio Rápido

```bash
# 1. Instalar doctl
brew install doctl  # macOS
# o ver QUICK_START.md para Linux

# 2. Autenticar
doctl auth init

# 3. Deployment automatizado
./deployment/digitalocean/deploy-digitalocean.sh \
    clienteA \
    clienteA.com \
    dop_v1_tu_token
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisar [README.md](./README.md) sección Troubleshooting
2. Ejecutar [health-check.sh](./health-check.sh)
3. Verificar logs: `docker-compose logs`

## 📝 Notas Importantes

- ⚠️ **Backups**: Los backups de database son automáticos, pero verifica la configuración
- ⚠️ **SSL**: Certbot renueva automáticamente, pero verifica los logs periódicamente
- ⚠️ **Costos**: Monitorea el uso para evitar sorpresas
- ⚠️ **Seguridad**: Nunca commitear `.env` o secrets

---

**¿Listo para empezar?** → [QUICK_START.md](./QUICK_START.md)

