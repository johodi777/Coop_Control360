# ⏰ Configuración de Cron Job para Reset Mensual

Guía para configurar el reset mensual automático usando cron del sistema operativo.

## 🎯 ¿Por qué usar Cron del Sistema?

El cron del sistema operativo es más confiable porque:
- ✅ Se ejecuta aunque el servidor Node.js no esté corriendo
- ✅ Se ejecuta aunque el servidor se reinicie
- ✅ Es independiente del proceso de Node.js
- ✅ Se ejecuta exactamente a la hora programada

## 🚀 Configuración Rápida

### Opción 1: Script Automatizado (Recomendado)

```bash
# Desde la raíz del proyecto
cd backend/scripts
chmod +x setup-cron.sh
sudo ./setup-cron.sh
```

Este script:
- ✅ Verifica que Node.js esté instalado
- ✅ Crea el archivo de log
- ✅ Configura el cron job automáticamente
- ✅ Verifica si ya existe y ofrece reemplazarlo

### Opción 2: Configuración Manual

#### 1. Dar permisos de ejecución al script

```bash
chmod +x backend/scripts/monthly-reset-cron.js
```

#### 2. Encontrar la ruta de Node.js

```bash
which node
# Ejemplo: /usr/bin/node
```

#### 3. Editar crontab

```bash
crontab -e
```

#### 4. Agregar esta línea

```cron
# Reset mensual de pagos - Día 1 de cada mes a las 00:00
0 0 1 * * /usr/bin/node /ruta/completa/al/proyecto/backend/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
```

**Reemplazar:**
- `/usr/bin/node` con la ruta de tu Node.js (`which node`)
- `/ruta/completa/al/proyecto` con la ruta completa a tu proyecto

**Ejemplo:**
```cron
0 0 1 * * /usr/bin/node /var/www/coopcontrol/backend/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
```

#### 5. Guardar y salir

- En `nano`: `Ctrl+X`, luego `Y`, luego `Enter`
- En `vi`: `:wq`

## 📋 Formato del Cron

```
0 0 1 * *
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-7, 0 y 7 = domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

**`0 0 1 * *`** = Día 1 de cada mes a las 00:00 (medianoche)

## 🔍 Verificar Configuración

### Ver cron jobs configurados

```bash
crontab -l
```

### Ver logs

```bash
# Ver últimas líneas
tail -n 50 /var/log/coopcontrol-reset.log

# Seguir logs en tiempo real
tail -f /var/log/coopcontrol-reset.log
```

### Probar manualmente

```bash
# Ejecutar el script manualmente
node backend/scripts/monthly-reset-cron.js

# O con ruta completa
/usr/bin/node /ruta/al/proyecto/backend/scripts/monthly-reset-cron.js
```

## 🐳 Para Docker

Si usas Docker, necesitas configurar el cron en el **host**, no en el contenedor:

### Opción A: Cron en el Host

```bash
# En el servidor (fuera del contenedor)
crontab -e

# Agregar (ajustar rutas según tu setup)
0 0 1 * * docker exec -i coopcontrol_backend node /usr/src/app/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
```

### Opción B: Cron en Contenedor con Volumen

1. Montar el script como volumen
2. Configurar cron dentro del contenedor
3. Asegurar que el contenedor siempre esté corriendo

```dockerfile
# En Dockerfile
RUN apt-get update && apt-get install -y cron

# Copiar script de cron
COPY crontab /etc/cron.d/monthly-reset
RUN chmod 0644 /etc/cron.d/monthly-reset
RUN crontab /etc/cron.d/monthly-reset

# Iniciar cron
CMD cron && node src/app.js
```

## 🌍 Zona Horaria

El script usa la zona horaria del sistema. Para cambiarla:

```bash
# Ver zona horaria actual
timedatectl

# Cambiar zona horaria (ejemplo: Colombia)
sudo timedatectl set-timezone America/Bogota
```

O en el cron:

```cron
# Especificar zona horaria en el cron
TZ=America/Bogota
0 0 1 * * /usr/bin/node /ruta/script.js
```

## 🔧 Troubleshooting

### Problema: "No se ejecuta el cron"

**Solución:**
1. Verificar que el cron está corriendo:
   ```bash
   sudo systemctl status cron
   # O en algunos sistemas:
   sudo systemctl status crond
   ```

2. Verificar logs del sistema:
   ```bash
   sudo tail -f /var/log/syslog | grep CRON
   ```

3. Verificar permisos del script:
   ```bash
   ls -l backend/scripts/monthly-reset-cron.js
   # Debe tener permisos de ejecución: -rwxr-xr-x
   ```

### Problema: "Error de conexión a base de datos"

**Solución:**
1. Verificar que el `.env` está en la ubicación correcta
2. Verificar variables de entorno en el cron:
   ```cron
   0 0 1 * * cd /ruta/al/proyecto/backend && /usr/bin/node scripts/monthly-reset-cron.js
   ```

### Problema: "No encuentra módulos"

**Solución:**
1. Asegurar que `node_modules` está instalado:
   ```bash
   cd backend
   npm install
   ```

2. Usar ruta absoluta en el cron:
   ```cron
   0 0 1 * * cd /ruta/al/proyecto/backend && /usr/bin/node scripts/monthly-reset-cron.js
   ```

## 📊 Monitoreo

### Verificar última ejecución

```bash
# Ver último log
tail -n 20 /var/log/coopcontrol-reset.log

# Verificar en la base de datos
mysql -u usuario -p coopcontrol -e "SELECT * FROM settings WHERE key = 'last_monthly_reset';"
```

### Alertas (Opcional)

Puedes configurar alertas si el reset falla:

```bash
# Script de verificación
#!/bin/bash
LAST_RESET=$(mysql -u usuario -p coopcontrol -e "SELECT value FROM settings WHERE key = 'last_monthly_reset';" -N)
CURRENT_MONTH=$(date +%Y-%m)

if [ "$LAST_RESET" != "$CURRENT_MONTH" ]; then
    echo "⚠️ Reset mensual no ejecutado este mes" | mail -s "Alerta Reset Mensual" admin@example.com
fi
```

## ✅ Checklist

- [ ] Script `monthly-reset-cron.js` tiene permisos de ejecución
- [ ] Cron job configurado con `crontab -e`
- [ ] Ruta de Node.js correcta
- [ ] Ruta del script correcta
- [ ] Archivo de log creado y con permisos
- [ ] Probado manualmente
- [ ] Verificado en `crontab -l`
- [ ] Zona horaria configurada correctamente

## 📝 Notas Importantes

1. **El cron se ejecuta con el usuario que lo configuró**
   - Si lo configuraste como `root`, se ejecuta como root
   - Si lo configuraste como usuario normal, se ejecuta como ese usuario
   - Asegúrate de que el usuario tenga permisos para:
     - Leer el `.env`
     - Conectarse a la base de datos
     - Escribir en el log

2. **Variables de entorno**
   - El script carga el `.env` automáticamente
   - Si hay problemas, verifica que el `.env` está en la ubicación correcta

3. **Backup antes de ejecutar**
   - El script no hace backup automático
   - Considera hacer backup de la BD antes del día 1

---

**¿Problemas?** Revisa los logs en `/var/log/coopcontrol-reset.log`

