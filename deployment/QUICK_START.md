# Quick Start - Migración Rápida

Guía rápida para migrar un cliente en 5 pasos.

## Prerrequisitos

- Servidor Linux con acceso SSH
- MySQL/MariaDB instalado (o usar Docker)
- Node.js instalado (para scripts de migración)
- Dominio apuntando al servidor (para SSL)

## Paso 1: Evaluar Cliente

```bash
# Conectar a BD original
mysql -u root -p coopcontrol

# Ver cooperativas
SELECT id, name, nit FROM cooperatives WHERE isActive = 1;

# Elegir ID de cooperativa a migrar (ejemplo: 5)
```

## Paso 2: Migrar Datos

```bash
cd backend

# Migrar datos (ejemplo: cooperativa 5 -> clienteA_db)
node scripts/migrate-client-data.js 5 clienteA_db
```

## Paso 3: Migrar Archivos

```bash
# Crear directorio destino
mkdir -p /var/www/clienteA/uploads

# Migrar archivos
node scripts/migrate-client-files.js 5 /var/www/clienteA/uploads
```

## Paso 4: Deployment

```bash
# Opción A: Automatizado (recomendado)
chmod +x deployment/deploy-cliente.sh
./deployment/deploy-cliente.sh clienteA clienteA.com ~/.ssh/id_rsa

# Opción B: Manual
# Ver MIGRATION_GUIDE.md sección 5.3
```

## Paso 5: Verificar

```bash
# Health check
curl https://clienteA.com/health

# Verificar frontend
# Abrir https://clienteA.com en navegador
```

## ✅ Listo!

El cliente ya está en su propio servidor independiente.

## 📝 Notas

- Revisa `.env` en `/var/www/clienteA/` y actualiza credenciales
- Verifica logs: `docker-compose -f /var/www/clienteA/docker-compose.yml logs`
- Configura backups si no se configuraron automáticamente

## 🆘 Problemas?

Ver `MIGRATION_GUIDE.md` sección "Troubleshooting"

