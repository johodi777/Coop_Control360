const XLSX = require('xlsx');
const db = require('../models');
const path = require('path');
const fs = require('fs');

const Affiliate = db.Affiliate;
const Cooperative = db.Cooperative;
const Setting = db.Setting;

// Función para obtener el mapeo de auxiliares desde la base de datos
async function getAssistantMap() {
  try {
    const setting = await Setting.findOne({ 
      where: { key: 'assistants', isActive: true } 
    });

    if (!setting) {
      // Retornar mapeo por defecto si no existe configuración
      return {
        'Natalia': 'natalia',
        'natalia': 'natalia',
        'Halalia': 'natalia',
        'halalia': 'natalia',
        'Lina': 'lina',
        'lina': 'lina',
      };
    }

    let assistants = [];
    try {
      assistants = JSON.parse(setting.value);
    } catch (e) {
      assistants = [];
    }

    // Crear mapeo dinámico desde la configuración
    const map = {};
    assistants.forEach(assistant => {
      // Mapear nombre y variaciones comunes
      map[assistant.name] = assistant.id;
      map[assistant.name.toLowerCase()] = assistant.id;
      map[assistant.id] = assistant.id;
      // Variaciones comunes (primera letra mayúscula, todo mayúsculas, etc.)
      const nameLower = assistant.name.toLowerCase();
      const nameUpper = assistant.name.toUpperCase();
      map[nameLower] = assistant.id;
      map[nameUpper] = assistant.id;
      // Variación con primera letra mayúscula
      const nameCapitalized = assistant.name.charAt(0).toUpperCase() + assistant.name.slice(1).toLowerCase();
      map[nameCapitalized] = assistant.id;
    });

    return map;
  } catch (error) {
    console.error('Error obteniendo auxiliares:', error);
    // Retornar mapeo por defecto en caso de error
    return {
      'Natalia': 'natalia',
      'natalia': 'natalia',
      'Halalia': 'natalia',
      'halalia': 'natalia',
      'Lina': 'lina',
      'lina': 'lina',
    };
  }
}

// Mapeo de estados de pago basado en emojis o texto
const PAYMENT_STATUS_MAP = {
  '✅': 'paid',
  '💲': 'pending',
  '✅✅': 'paid_payroll',
  '💰': 'pending_contribution',
  '🆕': 'new',
  '🚨': 'retired',
  'Pagó': 'paid',
  'Pendiente': 'pending',
  'Nuevo': 'new',
  'Retiro': 'retired',
};

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  // Remover símbolos de moneda, espacios y puntos de miles
  const cleaned = String(amountStr)
    .replace(/[$\s.]/g, '')
    .replace(/,/g, '.')
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function extractPaymentStatus(cellValue) {
  if (!cellValue) return 'pending';
  const str = String(cellValue);
  
  // Buscar emojis
  for (const [emoji, status] of Object.entries(PAYMENT_STATUS_MAP)) {
    if (str.includes(emoji)) {
      return status;
    }
  }
  
  // Buscar texto
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes('pagó') || lowerStr.includes('pago')) {
    return 'paid';
  }
  if (lowerStr.includes('pendiente')) {
    return 'pending_contribution';
  }
  if (lowerStr.includes('nuevo')) {
    return 'new';
  }
  if (lowerStr.includes('retiro')) {
    return 'retired';
  }
  
  return 'pending';
}

function extractAssistant(cellValue, assistantMap) {
  if (!cellValue || !assistantMap) return null;
  const str = String(cellValue).trim();
  return assistantMap[str] || null;
}

function parseName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop();
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

async function importFromExcel(filePath) {
  try {
    console.log('Leyendo archivo Excel:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe: ${filePath}`);
    }

    // Cargar mapeo de auxiliares desde la base de datos
    const assistantMap = await getAssistantMap();
    console.log('Mapeo de auxiliares cargado:', assistantMap);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: null,
      raw: false 
    });

    console.log(`Total de filas encontradas: ${data.length}`);

    // Obtener o crear la cooperativa por defecto
    let cooperative = await Cooperative.findOne();
    if (!cooperative) {
      cooperative = await Cooperative.create({
        name: 'Cooperativa Principal',
        nit: '900000000-1',
        address: '',
        phone: '',
        email: '',
      });
    }

    const results = {
      success: 0,
      errors: 0,
      skipped: 0,
      errorsList: [],
    };

    // Buscar la fila de encabezados de forma inteligente
    // Puede estar en la primera, segunda o tercera fila
    let headerRowIndex = 0;
    let headers = data[0] || [];
    
    // Palabras clave que indican que es una fila de encabezados
    const headerKeywords = ['nombre', 'documento', 'cedula', 'empresa', 'auxiliar', 'direccion', 'celular', 'total', 'planilla'];
    
    // Buscar la fila que más se parezca a encabezados
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i] || [];
      const rowText = row.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
      
      // Contar cuántas palabras clave de encabezados aparecen en esta fila
      const matches = headerKeywords.filter(keyword => rowText.includes(keyword)).length;
      
      if (matches >= 3) {
        // Esta fila parece ser la de encabezados
        headerRowIndex = i;
        headers = row;
        console.log(`✓ Fila de encabezados encontrada en la fila ${i + 1}`);
        break;
      }
    }
    
    // Si no encontramos una fila con muchas coincidencias, usar la primera fila no vacía
    if (headerRowIndex === 0 && (!headers || headers.every(cell => !cell || String(cell).trim() === ''))) {
      for (let i = 1; i < Math.min(5, data.length); i++) {
        const row = data[i] || [];
        if (row.some(cell => cell && String(cell).trim() !== '')) {
          headerRowIndex = i;
          headers = row;
          console.log(`✓ Usando fila ${i + 1} como encabezados (primera fila con datos)`);
          break;
        }
      }
    }
    
    console.log('=== INFORMACIÓN DE IMPORTACIÓN ===');
    console.log('Total de filas en el Excel:', data.length);
    console.log(`Fila de encabezados: ${headerRowIndex + 1}`);
    console.log('Encabezados encontrados:', headers);
    console.log('Número de columnas:', headers.length);

    // Buscar índices de columnas según la estructura del Excel
    const findColumnIndex = (keywords) => {
      for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').toLowerCase().trim();
        // Normalizar espacios múltiples
        const normalizedHeader = header.replace(/\s+/g, ' ');
        
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          const normalizedKeyword = keywordLower.replace(/\s+/g, ' ');
          
          // Primero buscar coincidencia exacta
          if (normalizedHeader === normalizedKeyword) {
            console.log(`  ✓ Columna "${headers[i]}" (índice ${i}) coincide exactamente con "${keyword}"`);
            return i;
          }
          // Luego buscar si contiene la palabra clave
          if (normalizedHeader.includes(normalizedKeyword)) {
            console.log(`  ✓ Columna "${headers[i]}" (índice ${i}) contiene "${keyword}"`);
            return i;
          }
        }
      }
      return -1;
    };

    // Buscar columnas de forma flexible - el aplicativo se adapta al Excel
    // Intentamos múltiples variaciones y sinónimos para cada columna
    
    // NOMBRE: buscar múltiples variaciones
    const nombreIndex = findColumnIndex([
      'nombre', 'nombres', 'nombre completo', 'nombrecompleto', 
      'nombres y apellidos', 'apellidos y nombres', 'afiliado', 'cliente',
      'persona', 'nombre del afiliado', 'nombre del cliente'
    ]);
    
    // DOCUMENTO: buscar múltiples variaciones
    const documentoIndex = findColumnIndex([
      'documento', 'documento de identidad', 'cedula', 'cédula', 'cc', 
      'nit', 'identificación', 'identificacion', 'id', 'numero documento',
      'número documento', 'num documento', 'doc', 'ced', 'dni'
    ]);
    
    // EMPRESA/RAZÓN SOCIAL: buscar múltiples variaciones
    const empresaIndex = findColumnIndex([
      'empresa', 'razon social', 'razón social', 'razonsocial',
      'razon', 'empresa o razón social', 'negocio', 'comercio'
    ]);
    
    // AUXILIAR: buscar múltiples variaciones
    const auxiliarIndex = findColumnIndex([
      'auxiliar', 'asistente', 'responsable', 'encargado', 
      'aux', 'asist', 'gestor', 'coordinador'
    ]);
    
    // DIRECCIÓN: buscar múltiples variaciones
    const direccionIndex = findColumnIndex([
      'dirección', 'direccion', 'dir', 'address', 'direccion completa',
      'domicilio', 'residencia', 'ubicación', 'ubicacion'
    ]);
    
    // CELULAR/TELÉFONO: buscar múltiples variaciones
    const celularIndex = findColumnIndex([
      'celular', 'telefono', 'teléfono', 'tel', 'phone', 'movil', 'móvil',
      'cel', 'numero celular', 'número celular', 'contacto'
    ]);
    
    // OCUPACIÓN: buscar múltiples variaciones
    const ocupacionIndex = findColumnIndex([
      'ocupación', 'ocupacion', 'cargo', 'profesion', 'profesión',
      'trabajo', 'oficio', 'actividad'
    ]);
    
    // RIESGO: buscar múltiples variaciones
    const riesgoIndex = findColumnIndex([
      'riesgo', 'nivel riesgo', 'riesgo arl', 'arl riesgo',
      'clase riesgo', 'categoria riesgo', 'categoría riesgo'
    ]);
    
    // EPS, ARL, CCF, AFP: buscar múltiples variaciones
    const epsIndex = findColumnIndex(['eps', 'entidad promotora salud', 'salud']);
    const arlIndex = findColumnIndex(['arl', 'administradora riesgos', 'riesgos laborales']);
    const ccfIndex = findColumnIndex([
      'ccf', 'caja compensación', 'caja de compensación', 
      'caja compensacion familiar', 'compensación familiar'
    ]);
    const afpIndex = findColumnIndex([
      'afp', 'administradora fondos pensiones', 'pensión', 'pension',
      'fondo pensiones', 'fondo de pensiones'
    ]);
    
    // PLANES: buscar múltiples variaciones
    const planesIndex = findColumnIndex([
      'planes', 'plan', 'tipo plan', 'tipo de plan', 'servicio',
      'paquete', 'modalidad'
    ]);
    
    // TOTAL A PAGAR: buscar múltiples variaciones
    const totalIndex = findColumnIndex([
      'total a pagar', 'total pagar', 'total', 'monto', 'valor',
      'aporte', 'aporte mensual', 'mensualidad', 'pago mensual',
      'total pagar', 'a pagar', 'importe'
    ]);
    
    // TOTAL A PAGAR PLANILLA: buscar múltiples variaciones
    const totalPlanillaIndex = findColumnIndex([
      'total a pagar planilla', 'total pagar planilla', 'planilla',
      'pago planilla', 'planilla pagada', 'pagado planilla',
      'total planilla', 'monto planilla'
    ]);
    
    // GANANCIA: buscar múltiples variaciones
    const gananciaIndex = findColumnIndex([
      'ganancia', 'profit', 'utilidad', 'beneficio', 'margen',
      'ganancia neta', 'utilidad neta'
    ]);
    
    // Validación flexible - intentar detectar automáticamente si no se encontraron
    let finalNombreIndex = nombreIndex;
    let finalDocumentoIndex = documentoIndex;
    
    if (finalNombreIndex < 0) {
      console.warn('⚠ No se encontró columna de NOMBRE, intentando detección automática...');
      // Buscar la primera columna con texto que parezca un nombre
      for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').toLowerCase().trim();
        if (header && header.length > 2 && !header.match(/^\d+$/)) {
          // Verificar si alguna fila tiene datos que parezcan nombres
          let hasNameLikeData = false;
          for (let rowIdx = 1; rowIdx < Math.min(6, data.length); rowIdx++) {
            const cellValue = String(data[rowIdx]?.[i] || '').trim();
            if (cellValue && cellValue.length > 5 && cellValue.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/)) {
              hasNameLikeData = true;
              break;
            }
          }
          if (hasNameLikeData) {
            console.log(`  ✓ Detectada columna "${headers[i]}" (índice ${i}) como NOMBRE`);
            finalNombreIndex = i;
            break;
          }
        }
      }
    }
    
    if (finalDocumentoIndex < 0) {
      console.warn('⚠ No se encontró columna de DOCUMENTO, intentando detección automática...');
      // Buscar columna con números que parezcan documentos
      for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').toLowerCase().trim();
        if (header && (header.includes('doc') || header.includes('num') || header.includes('id') || header.match(/^\d/))) {
          // Verificar si alguna fila tiene datos numéricos
          let hasNumericData = false;
          for (let rowIdx = 1; rowIdx < Math.min(6, data.length); rowIdx++) {
            const cellValue = String(data[rowIdx]?.[i] || '').trim().replace(/[.\s]/g, '');
            if (cellValue && cellValue.match(/^\d{6,}$/)) {
              hasNumericData = true;
              break;
            }
          }
          if (hasNumericData) {
            console.log(`  ✓ Detectada columna "${headers[i]}" (índice ${i}) como DOCUMENTO`);
            finalDocumentoIndex = i;
            break;
          }
        }
      }
    }
    
    // Usar los índices encontrados (o detectados automáticamente)
    const nameIndex = finalNombreIndex;
    const documentIndex = finalDocumentoIndex;
    const amountIndex = totalIndex >= 0 ? totalIndex : (totalPlanillaIndex >= 0 ? totalPlanillaIndex : -1);
    const assistantIndex = auxiliarIndex;
    const businessIndex = empresaIndex;

    console.log('=== ÍNDICES DE COLUMNAS ENCONTRADOS ===');
    const indices = {
      empresa: empresaIndex,
      auxiliar: auxiliarIndex,
      nombre: nameIndex,
      documento: documentIndex,
      direccion: direccionIndex,
      celular: celularIndex,
      ocupacion: ocupacionIndex,
      riesgo: riesgoIndex,
      eps: epsIndex,
      arl: arlIndex,
      ccf: ccfIndex,
      afp: afpIndex,
      planes: planesIndex,
      total: totalIndex,
      totalPlanilla: totalPlanillaIndex,
      ganancia: gananciaIndex,
    };
    console.log(indices);
    
    // Validación final - si aún no encontramos las columnas esenciales después de la detección automática
    if (nameIndex < 0 || documentIndex < 0) {
      console.error('❌ ERROR: No se pudieron identificar las columnas esenciales');
      console.log('\n📋 Columnas disponibles en el Excel:');
      headers.forEach((h, i) => {
        console.log(`  ${i}: "${h || '(vacía)'}"`);
      });
      console.log('\n💡 El aplicativo intentó buscar columnas con estos nombres:');
      console.log('  - NOMBRE: nombre, nombres, nombre completo, afiliado, cliente, etc.');
      console.log('  - DOCUMENTO: documento, cedula, cédula, cc, nit, identificación, etc.');
      throw new Error(
        `No se pudieron identificar las columnas necesarias en el Excel.\n\n` +
        `Columnas encontradas: ${headers.filter(h => h).join(', ') || '(ninguna)'}\n\n` +
        `El aplicativo intentó buscar columnas con múltiples variaciones de nombres.\n` +
        `Por favor, verifica que el Excel tenga al menos una columna con nombres de personas ` +
        `y otra con números de documento/identificación.`
      );
    }

    // Procesar filas (empezar después de la fila de encabezados)
    const startRowIndex = headerRowIndex + 1;
    console.log(`\n=== PROCESANDO ${data.length - startRowIndex} FILAS (desde fila ${startRowIndex + 1}) ===`);
    let processedRows = 0;
    
    for (let i = startRowIndex; i < data.length; i++) {
      const row = data[i];
      processedRows++;
      
      // Saltar filas vacías
      if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
        if (processedRows <= 5) {
          console.log(`Fila ${i + 1}: VACÍA (saltada)`);
        }
        continue;
      }
      
      if (processedRows <= 5) {
        console.log(`\nFila ${i + 1}:`, row.slice(0, 5)); // Mostrar primeras 5 columnas
      }

      try {
        // Obtener datos de las columnas según la estructura del Excel
        const empresa = businessIndex >= 0 ? row[businessIndex] : null;
        const auxiliar = assistantIndex >= 0 ? row[assistantIndex] : null;
        const nombre = nameIndex >= 0 ? row[nameIndex] : null;
        const documento = documentIndex >= 0 ? row[documentIndex] : null;
        const direccion = direccionIndex >= 0 ? row[direccionIndex] : null;
        const celular = celularIndex >= 0 ? row[celularIndex] : null;
        const ocupacion = ocupacionIndex >= 0 ? row[ocupacionIndex] : null;
        const riesgo = riesgoIndex >= 0 ? row[riesgoIndex] : null;
        const eps = epsIndex >= 0 ? row[epsIndex] : null;
        const arl = arlIndex >= 0 ? row[arlIndex] : null;
        const ccf = ccfIndex >= 0 ? row[ccfIndex] : null;
        const afp = afpIndex >= 0 ? row[afpIndex] : null;
        const plan = planesIndex >= 0 ? row[planesIndex] : null;
        const total = totalIndex >= 0 ? row[totalIndex] : null;
        const totalPlanilla = totalPlanillaIndex >= 0 ? row[totalPlanillaIndex] : null;
        const ganancia = gananciaIndex >= 0 ? row[gananciaIndex] : null;

        // Validar datos mínimos
        if (!nombre || !documento) {
          results.skipped++;
          const errorMsg = `Falta nombre o documento (nombre: "${nombre}", documento: "${documento}")`;
          results.errorsList.push({
            row: i + 1,
            error: errorMsg,
            data: row,
          });
          if (results.skipped <= 3) {
            console.log(`  ⚠ Fila ${i + 1} omitida: ${errorMsg}`);
          }
          continue;
        }

        const { firstName, lastName } = parseName(nombre);
        const documentNumber = String(documento || '').trim();
        const assistantId = extractAssistant(auxiliar, assistantMap);
        const businessName = empresa ? String(empresa).trim() : null;
        
        // Usar TOTAL como monthlyContribution, si no existe usar TOTAL A PAGAR PLANILLA
        const monthlyContribution = parseAmount(total || totalPlanilla);
        
        // Determinar estado de pago basado en los valores
        // Si tiene TOTAL A PAGAR PLANILLA, significa que ya pagó planilla
        // Si tiene GANANCIA, significa que ya pagó
        // Si no tiene ninguno, está pendiente
        let paymentStatus = 'pending';
        const totalPlanillaAmount = totalPlanilla ? parseAmount(totalPlanilla) : 0;
        const gananciaAmount = ganancia ? parseAmount(ganancia) : 0;
        
        if (totalPlanillaAmount > 0) {
          paymentStatus = 'paid_payroll';
        } else if (gananciaAmount > 0) {
          paymentStatus = 'paid';
        } else if (monthlyContribution > 0) {
          // Si tiene monto pero no tiene planilla ni ganancia, está pendiente
          paymentStatus = 'pending';
        } else {
          // Si no tiene monto, podría ser nuevo
          paymentStatus = 'new';
        }
        
        // Guardar información adicional en notes como JSON
        const additionalInfo = {
          direccion: direccion ? String(direccion).trim() : null,
          celular: celular ? String(celular).trim() : null,
          ocupacion: ocupacion ? String(ocupacion).trim() : null,
          riesgo: riesgo ? String(riesgo).trim() : null,
          eps: eps ? String(eps).trim() : null,
          arl: arl ? String(arl).trim() : null,
          ccf: ccf ? String(ccf).trim() : null,
          afp: afp ? String(afp).trim() : null,
          plan: plan ? String(plan).trim() : null,
          totalPlanilla: totalPlanilla ? parseAmount(totalPlanilla) : null,
          ganancia: ganancia ? parseAmount(ganancia) : null,
        };

        // Verificar si el afiliado ya existe
        const existing = await Affiliate.findOne({
          where: { documentNumber: String(documentNumber).trim() }
        });

        const affiliateData = {
          cooperativeId: cooperative.id,
          firstName,
          lastName: lastName || 'Sin apellido',
          documentType: 'CC',
          documentNumber: documentNumber,
          phone: additionalInfo.celular,
          address: additionalInfo.direccion,
          occupation: additionalInfo.ocupacion,
          monthlyContribution,
          status: paymentStatus === 'retired' ? 'retirado' : 'activo',
          assistantId: assistantId || null,
          businessName: businessName,
          paymentStatus,
          notes: JSON.stringify(additionalInfo),
          affiliationDate: new Date(),
        };

        if (existing) {
          // Actualizar afiliado existente
          await existing.update(affiliateData);
          if (results.success < 5 || results.success % 10 === 0) {
            console.log(`✓ Actualizado: ${firstName} ${lastName} (${documentNumber})`);
          }
          results.success++;
        } else {
          // Crear nuevo afiliado
          await Affiliate.create(affiliateData);
          if (results.success < 5 || results.success % 10 === 0) {
            console.log(`✓ Creado: ${firstName} ${lastName} (${documentNumber})`);
          }
          results.success++;
        }
      } catch (error) {
        results.errors++;
        results.errorsList.push({
          row: i + 1,
          error: error.message,
          data: row,
        });
        console.error(`✗ Error en fila ${i + 1}:`, error.message);
      }
    }

    console.log('\n=== Resumen de Importación ===');
    console.log(`✓ Exitosos: ${results.success}`);
    console.log(`✗ Errores: ${results.errors}`);
    console.log(`⊘ Omitidos: ${results.skipped}`);

    if (results.errorsList.length > 0) {
      console.log('\nErrores detallados:');
      results.errorsList.slice(0, 10).forEach(err => {
        console.log(`  Fila ${err.row}: ${err.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('Error importando Excel:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const filePath = process.argv[2] || path.join(__dirname, '../../Control Afiliaciones.xlsx');
  
  importFromExcel(filePath)
    .then(results => {
      console.log('\nImportación completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { importFromExcel };

