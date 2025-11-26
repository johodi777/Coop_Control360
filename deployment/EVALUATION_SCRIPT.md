# Script de Evaluación Inicial

Este documento te ayuda a evaluar tu sistema actual antes de la migración.

## 1. Verificar Estructura Multi-tenant

### A) Base de Datos

```sql
-- Verificar si usas una sola BD con cooperativeId
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'coopcontrol'
AND COLUMN_NAME LIKE '%cooperative%' OR COLUMN_NAME LIKE '%empresa%'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Contar cooperativas activas
SELECT COUNT(*) as total_cooperativas FROM cooperatives WHERE isActive = 1;

-- Ver distribución de datos por cooperativa
SELECT 
    c.id,
    c.name,
    COUNT(a.id) as total_afiliados,
    COUNT(i.id) as total_facturas,
    COUNT(t.id) as total_transacciones
FROM cooperatives c
LEFT JOIN affiliates a ON a.cooperativeId = c.id
LEFT JOIN invoices i ON i.affiliateId = a.id
LEFT JOIN transactions t ON t.affiliateId = a.id
WHERE c.isActive = 1
GROUP BY c.id, c.name;
```

### B) Archivos

```bash
# Verificar estructura de uploads
ls -la backend/uploads/

# Verificar si hay separación por cooperativa
find backend/uploads -type d -name "*cooperative*" -o -name "*empresa*"

# Tamaño total de uploads
du -sh backend/uploads/
```

### C) Configuración

```bash
# Verificar .env
cat backend/.env | grep -E "DB_|APP_|JWT_"

# Verificar docker-compose
cat backend/docker-compose.yml
```

## 2. Identificar Dependencias

### A) Código que usa cooperativeId

```bash
# Buscar en controladores
grep -r "cooperativeId" backend/src/controllers/

# Buscar en modelos
grep -r "cooperativeId" backend/src/models/

# Buscar en rutas
grep -r "cooperativeId" backend/src/routes/
```

### B) Lógica de permisos

```bash
# Verificar middleware de autenticación
cat backend/src/middleware/auth.middleware.js

# Verificar si hay filtrado por cooperativa en queries
grep -r "WHERE.*cooperative" backend/src/
```

## 3. Evaluar Complejidad

### Preguntas:

1. **¿Cuántas cooperativas activas tienes?**
   ```sql
   SELECT COUNT(*) FROM cooperatives WHERE isActive = 1;
   ```

2. **¿Cuántos afiliados por cooperativa?**
   ```sql
   SELECT 
       c.name,
       COUNT(a.id) as afiliados
   FROM cooperatives c
   LEFT JOIN affiliates a ON a.cooperativeId = c.id
   WHERE c.isActive = 1
   GROUP BY c.id, c.name;
   ```

3. **¿Cuántos archivos por cooperativa?**
   ```bash
   # Esto requiere análisis manual o script adicional
   ```

4. **¿Hay lógica compartida entre cooperativas?**
   - ⬜ Configuraciones globales
   - ⬜ Reportes consolidados
   - ⬜ Usuarios compartidos

## 4. Plan de Migración

### Orden sugerido:

1. **Cliente pequeño primero** (menos riesgo)
2. **Cliente de prueba** (validar proceso)
3. **Clientes grandes** (requieren más tiempo)

### Tiempo estimado por cliente:

- **Pequeño** (< 100 afiliados): 1-2 horas
- **Mediano** (100-1000 afiliados): 2-4 horas
- **Grande** (> 1000 afiliados): 4-8 horas

## 5. Checklist Pre-Migración

- [ ] Backup completo del sistema original
- [ ] Scripts de migración probados
- [ ] Servidor de destino preparado
- [ ] DNS configurado (opcional, puede ser después)
- [ ] Credenciales de acceso preparadas
- [ ] Cliente notificado

## 6. Riesgos Identificados

### Riesgos Comunes:

1. **Pérdida de datos durante migración**
   - Mitigación: Backups completos antes de migrar

2. **Archivos no encontrados**
   - Mitigación: Script de migración busca en subdirectorios

3. **Relaciones rotas**
   - Mitigación: Script migra en orden correcto

4. **Downtime durante cutover**
   - Mitigación: Migrar en horario de bajo tráfico

## 7. Recursos Necesarios

### Por Cliente:

- **Servidor**: 1 CPU, 2GB RAM mínimo
- **Almacenamiento**: Depende del tamaño de datos
- **Dominio**: 1 dominio o subdominio
- **SSL**: Certificado Let's Encrypt (gratis)

### Herramientas:

- Docker y Docker Compose
- MySQL/MariaDB
- Nginx
- Certbot (para SSL)
- rsync (para copiar archivos)

## 8. Próximos Pasos

Después de completar esta evaluación:

1. ✅ Revisar resultados
2. ✅ Decidir orden de migración
3. ✅ Preparar servidores
4. ✅ Ejecutar primera migración de prueba
5. ✅ Validar proceso
6. ✅ Migrar clientes restantes

---

**Nota:** Guarda los resultados de esta evaluación para referencia futura.

