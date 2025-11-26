const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class PDFGenerator {
  static generateInvoice(invoice, affiliate, cooperative) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20).text(cooperative.name || 'Cooperativa', { align: 'center' });
        doc.fontSize(12).text('FACTURA DE APORTE', { align: 'center' });
        doc.moveDown();

        // Información de la cooperativa
        if (cooperative.nit) {
          doc.fontSize(10).text(`NIT: ${cooperative.nit}`, { align: 'left' });
        }
        if (cooperative.address) {
          doc.fontSize(10).text(`Dirección: ${cooperative.address}`, { align: 'left' });
        }
        if (cooperative.phone) {
          doc.fontSize(10).text(`Teléfono: ${cooperative.phone}`, { align: 'left' });
        }
        doc.moveDown();

        // Información del afiliado
        doc.fontSize(14).text('DATOS DEL AFILIADO', { underline: true });
        doc.fontSize(10).text(`Nombre: ${affiliate.firstName} ${affiliate.lastName}`);
        doc.text(`Documento: ${affiliate.documentType} ${affiliate.documentNumber}`);
        if (affiliate.email) {
          doc.text(`Email: ${affiliate.email}`);
        }
        doc.moveDown();

        // Información de la factura
        doc.fontSize(14).text('DETALLE DE LA FACTURA', { underline: true });
        doc.fontSize(10);
        doc.text(`Número de factura: ${invoice.invoiceNumber || invoice.id}`);
        doc.text(`Concepto: ${invoice.concept}`);
        if (invoice.period) {
          doc.text(`Período: ${invoice.period}`);
        }
        doc.text(`Fecha de vencimiento: ${moment(invoice.dueDate).format('DD/MM/YYYY')}`);
        doc.moveDown();

        // Tabla de valores
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text('Descripción', 50, tableTop);
        doc.text('Valor', 400, tableTop, { align: 'right' });

        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();

        doc.text('Valor base', 50);
        doc.text(`$${parseFloat(invoice.baseAmount || 0).toLocaleString('es-CO')}`, 400, doc.y - 15, { align: 'right' });

        if (invoice.tax > 0) {
          doc.text('Impuestos', 50);
          doc.text(`$${parseFloat(invoice.tax).toLocaleString('es-CO')}`, 400, doc.y - 15, { align: 'right' });
        }

        if (invoice.discount > 0) {
          doc.text('Descuento', 50);
          doc.text(`-$${parseFloat(invoice.discount).toLocaleString('es-CO')}`, 400, doc.y - 15, { align: 'right' });
        }

        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTAL', 50);
        doc.text(`$${parseFloat(invoice.total).toLocaleString('es-CO')}`, 400, doc.y - 15, { align: 'right' });
        doc.font('Helvetica').fontSize(10);

        doc.moveDown(2);
        doc.text(`Estado: ${invoice.status.toUpperCase()}`, { align: 'center' });

        if (invoice.status === 'pagado' && invoice.paidDate) {
          doc.text(`Fecha de pago: ${moment(invoice.paidDate).format('DD/MM/YYYY')}`, { align: 'center' });
        }

        doc.moveDown();
        doc.fontSize(8).text(
          `Generado el ${moment().format('DD/MM/YYYY HH:mm')}`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateReport(data, title, type = 'general') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Encabezado
        doc.fontSize(20).text(title, { align: 'center' });
        doc.fontSize(12).text(`Generado el ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
        doc.moveDown();

        // Contenido según el tipo
        if (type === 'financial') {
          this._generateFinancialReport(doc, data);
        } else if (type === 'affiliates') {
          this._generateAffiliatesReport(doc, data);
        } else {
          this._generateGeneralReport(doc, data);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static _generateFinancialReport(doc, data) {
    doc.fontSize(14).text('REPORTE FINANCIERO', { underline: true });
    doc.moveDown();

    if (data.summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Total facturado: $${parseFloat(data.summary.totalInvoiced || 0).toLocaleString('es-CO')}`);
      doc.text(`Total pagado: $${parseFloat(data.summary.totalPaid || 0).toLocaleString('es-CO')}`);
      doc.text(`Total pendiente: $${parseFloat(data.summary.totalPending || 0).toLocaleString('es-CO')}`);
      doc.moveDown();
    }

    if (data.transactions && data.transactions.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Transacciones');
      doc.font('Helvetica').fontSize(10);
      data.transactions.forEach((tx, index) => {
        doc.text(`${index + 1}. ${tx.concept || 'Pago'} - $${parseFloat(tx.amount || 0).toLocaleString('es-CO')} - ${tx.status}`);
      });
    }
  }

  static _generateAffiliatesReport(doc, data) {
    doc.fontSize(14).text('REPORTE DE AFILIADOS', { underline: true });
    doc.moveDown();

    if (data.summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('Resumen');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Total afiliados: ${data.summary.total || 0}`);
      doc.text(`Activos: ${data.summary.active || 0}`);
      doc.text(`Morosos: ${data.summary.moroso || 0}`);
      doc.moveDown();
    }
  }

  static _generateGeneralReport(doc, data) {
    doc.fontSize(10);
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        doc.text(`${index + 1}. ${JSON.stringify(item)}`);
      });
    } else {
      doc.text(JSON.stringify(data, null, 2));
    }
  }
}

module.exports = PDFGenerator;

