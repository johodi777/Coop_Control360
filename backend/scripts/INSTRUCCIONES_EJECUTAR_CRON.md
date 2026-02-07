# 📋 Instrucciones para Ejecutar el Cron Job

## 🪟 Si estás en Windows (Desarrollo Local)

El script `setup-cron.sh` es para **Linux/Unix**. Tienes estas opciones:

### Opción 1: Ejecutar en el Servidor de Producción (Recomendado)

Cuando despliegues en tu servidor Linux (DigitalOcean, etc.), ejecuta allí:

```bash
# En el servidor Linux
cd /ruta/al/proyecto/backend/scripts
chmod +x setup-cron.sh
sudo ./setup-cron.sh
```

### Opción 2: Usar WSL (Windows Subsystem for Linux)

Si tienes WSL instalado:

```bash
# Abrir WSL
wsl

# Navegar al proyecto
cd /mnt/c/Users/Jonathan/Desktop/Concorde\ Software/Portafolio/Proyectos_aplicativos/CoopControl\ 360/Aplicativo/backend/scripts

# Ejecutar
chmod +x setup-cron.sh
sudo ./setup-cron.sh
```

### Opción 3: Configuración Manual en el Servidor

Cuando estés en tu servidor Linux, puedes configurarlo manualmente:

```bash
# 1. Editar crontab
crontab -e

# 2. Agregar esta línea (ajustar rutas):
0 0 1 * * /usr/bin/node /ruta/completa/al/proyecto/backend/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1

# 3. Guardar y salir
```

## 🐧 Si estás en Linux/Mac

Ejecuta directamente:

```bash
cd backend/scripts
chmod +x setup-cron.sh
sudo ./setup-cron.sh
```

## 🐳 Si usas Docker

Configura el cron en el **host** (servidor), no en el contenedor:

```bash
# En el servidor (fuera del contenedor)
crontab -e

# Agregar (ajustar según tu setup):
0 0 1 * * docker exec -i nombre_contenedor_backend node /usr/src/app/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
```

## ✅ Verificar que Funcionó

Después de ejecutar el script:

```bash
# Ver cron jobs configurados
crontab -l

# Debe mostrar algo como:
# 0 0 1 * * /usr/bin/node /ruta/al/proyecto/backend/scripts/monthly-reset-cron.js >> /var/log/coopcontrol-reset.log 2>&1
```

## 🧪 Probar Manualmente

Para probar que funciona:

```bash
# Ejecutar el script manualmente
node backend/scripts/monthly-reset-cron.js

# Ver logs
tail -f /var/log/coopcontrol-reset.log
```

## 📝 Nota Importante

- El cron job se ejecuta el **día 1 de cada mes a las 00:00**
- Funciona **independientemente** de si el servidor Node.js está corriendo
- Los logs se guardan en `/var/log/coopcontrol-reset.log`

---

**¿Necesitas ayuda?** Ver `deployment/cron-setup.md` para más detalles.

