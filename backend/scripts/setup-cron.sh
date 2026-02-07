#!/bin/bash

# Script para configurar el cron job del reset mensual
# Ejecutar como: sudo ./setup-cron.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔧 Configurando cron job para reset mensual de pagos..."
echo ""

# Obtener la ruta del proyecto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKEND_DIR="$PROJECT_DIR"
NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}❌ Error: Node.js no está instalado o no está en PATH${NC}"
    echo "   Instala Node.js o agrega la ruta completa a node"
    exit 1
fi

echo "📁 Directorio del proyecto: $PROJECT_DIR"
echo "📁 Directorio del backend: $BACKEND_DIR"
echo "🔧 Node.js path: $NODE_PATH"
echo ""

# Ruta del script
SCRIPT_PATH="$BACKEND_DIR/scripts/monthly-reset-cron.js"
LOG_PATH="/var/log/coopcontrol-reset.log"

# Verificar que el script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}❌ Error: No se encuentra el script en: $SCRIPT_PATH${NC}"
    exit 1
fi

# Dar permisos de ejecución
chmod +x "$SCRIPT_PATH"
echo -e "${GREEN}✓ Permisos de ejecución otorgados${NC}"

# Crear directorio de logs si no existe
if [ ! -d "$(dirname $LOG_PATH)" ]; then
    sudo mkdir -p "$(dirname $LOG_PATH)"
    echo -e "${GREEN}✓ Directorio de logs creado${NC}"
fi

# Crear archivo de log si no existe
sudo touch "$LOG_PATH"
sudo chmod 666 "$LOG_PATH"
echo -e "${GREEN}✓ Archivo de log creado: $LOG_PATH${NC}"

# Entrada del cron job
# Ejecutar el día 1 de cada mes a las 00:00 (medianoche)
CRON_ENTRY="0 0 1 * * $NODE_PATH $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Verificar si ya existe una entrada similar
EXISTING_CRON=$(crontab -l 2>/dev/null | grep "monthly-reset-cron.js" || true)

if [ -n "$EXISTING_CRON" ]; then
    echo -e "${YELLOW}⚠️ Ya existe una entrada de cron para el reset mensual${NC}"
    echo "   Entrada existente:"
    echo "   $EXISTING_CRON"
    echo ""
    read -p "¿Deseas reemplazarla? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operación cancelada."
        exit 0
    fi
    
    # Eliminar entrada existente
    crontab -l 2>/dev/null | grep -v "monthly-reset-cron.js" | crontab -
    echo -e "${GREEN}✓ Entrada anterior eliminada${NC}"
fi

# Agregar nueva entrada
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo ""
echo -e "${GREEN}✅ Cron job configurado exitosamente!${NC}"
echo ""
echo "📋 Configuración:"
echo "   - Ejecución: Día 1 de cada mes a las 00:00"
echo "   - Script: $SCRIPT_PATH"
echo "   - Log: $LOG_PATH"
echo ""
echo "📝 Verificar cron job:"
echo "   crontab -l"
echo ""
echo "📋 Ver logs:"
echo "   tail -f $LOG_PATH"
echo ""
echo "🧪 Probar manualmente:"
echo "   $NODE_PATH $SCRIPT_PATH"
echo ""

