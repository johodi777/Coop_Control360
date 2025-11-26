# Modificaciones Opcionales del Backend para Single-Tenant

Este documento explica las modificaciones **opcionales** que puedes hacer al backend para una versión completamente single-tenant.

**Nota importante:** Estas modificaciones NO son estrictamente necesarias. Como cada cliente tendrá su propia instancia independiente, el código actual funciona perfectamente. Estas modificaciones son solo para "limpiar" el código y hacerlo más simple.

## ¿Por qué es opcional?

En una instalación independiente por cliente:
- Solo habrá UNA cooperativa en la BD
- No hay riesgo de mezclar datos entre clientes
- El filtro por `cooperativeId` simplemente no se usará

Sin embargo, si quieres simplificar el código, puedes hacer estas modificaciones.

## Modificaciones Sugeridas

### 1. Eliminar Filtro Opcional de cooperativeId en Affiliates Controller

**Archivo:** `backend/src/controllers/affiliates.controller.js`

**Antes:**
```javascript
if (req.query.cooperativeId) {
  where.cooperativeId = req.query.cooperativeId;
}
```

**Después:**
```javascript
// En single-tenant, siempre filtramos por la única cooperativa
// O simplemente eliminamos el filtro ya que solo hay una
// Opcional: Obtener ID de la única cooperativa
const cooperative = await db.Cooperative.findOne({ where: { isActive: true } });
if (cooperative) {
  where.cooperativeId = cooperative.id;
}
```

O simplemente eliminar el filtro completamente si solo hay una cooperativa.

### 2. Simplificar Modelo de Affiliate (Opcional)

Si quieres eliminar completamente la columna `cooperativeId`:

**⚠️ ADVERTENCIA:** Esto requiere migración de BD. No recomendado a menos que estés seguro.

```javascript
// En affiliate.model.js
// Eliminar la línea:
cooperativeId: { type: DataTypes.INTEGER },
```

### 3. Crear Middleware de Single-Tenant (Opcional)

Si quieres asegurar que siempre se use la cooperativa correcta:

**Archivo:** `backend/src/middleware/singleTenant.middleware.js`

```javascript
const db = require('../models');

exports.ensureSingleTenant = async (req, res, next) => {
  try {
    // Obtener la única cooperativa activa
    const cooperative = await db.Cooperative.findOne({ 
      where: { isActive: true } 
    });

    if (!cooperative) {
      return res.status(500).json({
        success: false,
        message: 'No hay cooperativa configurada'
      });
    }

    // Agregar cooperativeId a req para uso en controladores
    req.cooperativeId = cooperative.id;
    req.cooperative = cooperative;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo información de cooperativa'
    });
  }
};
```

**Uso en rutas:**
```javascript
const { ensureSingleTenant } = require('../middleware/singleTenant.middleware');

router.get('/affiliates', 
  verifyToken, 
  ensureSingleTenant,  // Agregar este middleware
  affiliatesController.list
);
```

### 4. Simplificar Validadores (Opcional)

**Archivo:** `backend/src/utils/validators.js`

Si `cooperativeId` ya no es necesario en requests:

```javascript
// Antes
cooperativeId: Joi.number().integer().required(),

// Después (eliminar o hacer opcional)
// O simplemente eliminar de los schemas
```

## Recomendación

**NO modifiques el código a menos que:**

1. ✅ Estés 100% seguro que nunca necesitarás múltiples cooperativas en una instancia
2. ✅ Quieras simplificar el código para mantenimiento
3. ✅ Tengas tiempo para probar todas las funcionalidades después de los cambios

**Mejor práctica:**

Mantén el código actual porque:
- ✅ Funciona perfectamente en single-tenant
- ✅ Es más flexible si en el futuro necesitas agregar otra cooperativa
- ✅ No requiere cambios en la base de datos
- ✅ Menos riesgo de introducir bugs

## Si Decides Hacer las Modificaciones

### Proceso:

1. **Hacer backup del código actual**
   ```bash
   git commit -am "Backup antes de modificar a single-tenant"
   git tag backup-multi-tenant
   ```

2. **Aplicar modificaciones una por una**
   - Modificar controladores
   - Probar cada endpoint
   - Verificar que todo funciona

3. **Probar exhaustivamente**
   - Login
   - Listar afiliados
   - Crear/editar afiliados
   - Pagos
   - Reportes
   - Subida de archivos

4. **Desplegar en ambiente de prueba primero**

## Alternativa: Branch Separado

Si quieres mantener ambas versiones:

```bash
# Crear branch para single-tenant
git checkout -b single-tenant-version

# Aplicar modificaciones
# ... hacer cambios ...

# Mantener main como multi-tenant
git checkout main
```

## Conclusión

**Recomendación final:** Mantén el código actual. Es más seguro, flexible y funciona perfectamente para single-tenant sin modificaciones.

Las modificaciones son solo si quieres simplificar el código por razones de mantenimiento o estética, pero no son necesarias para el funcionamiento.

