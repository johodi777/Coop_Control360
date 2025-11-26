#!/bin/bash

# Script de health check para verificar el estado del deployment
# Uso: ./health-check.sh <dominio>

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Uso: ./health-check.sh <dominio>"
    echo "   Ejemplo: ./health-check.sh clienteA.com"
    exit 1
fi

echo "🏥 Health Check para: ${DOMAIN}"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar
check() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Verificando ${name}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (${response})"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (${response})"
        return 1
    fi
}

# Verificaciones
PASSED=0
FAILED=0

# 1. HTTPS disponible
if check "HTTPS" "https://${DOMAIN}" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# 2. Health endpoint
if check "API Health" "https://${DOMAIN}/health" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# 3. Frontend
if check "Frontend" "https://${DOMAIN}" 200; then
    ((PASSED++))
else
    ((FAILED++))
fi

# 4. SSL Certificate
echo -n "Verificando SSL Certificate... "
cert_info=$(echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ OK${NC}"
    echo "$cert_info" | sed 's/^/  /'
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# 5. DNS
echo -n "Verificando DNS... "
dns_ip=$(dig +short ${DOMAIN} | tail -1)
if [ -n "$dns_ip" ]; then
    echo -e "${GREEN}✓ OK${NC} (${dns_ip})"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# 6. Response time
echo -n "Verificando Response Time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "https://${DOMAIN}/health" 2>/dev/null)
if [ -n "$response_time" ]; then
    time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
    if [ "$time_ms" -lt 1000 ]; then
        echo -e "${GREEN}✓ OK${NC} (${time_ms}ms)"
    else
        echo -e "${YELLOW}⚠ SLOW${NC} (${time_ms}ms)"
    fi
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumen:"
echo -e "   ${GREEN}✓ Pasados: ${PASSED}${NC}"
echo -e "   ${RED}✗ Fallidos: ${FAILED}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todo está funcionando correctamente!${NC}"
    exit 0
else
    echo -e "${RED}❌ Hay problemas que necesitan atención${NC}"
    exit 1
fi

