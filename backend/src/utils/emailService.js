const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      logger.error('Error inicializando servicio de email:', error);
    }
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      if (!this.transporter) {
        logger.warn('Servicio de email no configurado');
        return { success: false, message: 'Servicio de email no configurado' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado a ${to}: ${info.messageId}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error enviando email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvoiceEmail(affiliate, invoice, pdfBuffer) {
    const subject = `Factura de Aporte - ${invoice.invoiceNumber || invoice.id}`;
    const html = `
      <h2>Estimado/a ${affiliate.firstName} ${affiliate.lastName}</h2>
      <p>Adjunto encontrará su factura de aporte correspondiente al período ${invoice.period || 'actual'}.</p>
      <p><strong>Valor a pagar:</strong> $${parseFloat(invoice.total).toLocaleString('es-CO')}</p>
      <p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('es-CO')}</p>
      <p>Por favor realice el pago antes de la fecha de vencimiento para evitar intereses de mora.</p>
      <p>Gracias por su atención.</p>
    `;

    return await this.sendEmail(
      affiliate.email,
      subject,
      html,
      [
        {
          filename: `factura-${invoice.invoiceNumber || invoice.id}.pdf`,
          content: pdfBuffer
        }
      ]
    );
  }

  async sendWelcomeEmail(affiliate, cooperative) {
    const subject = `Bienvenido a ${cooperative.name}`;
    const html = `
      <h2>Bienvenido/a ${affiliate.firstName} ${affiliate.lastName}</h2>
      <p>Nos complace informarle que ha sido registrado exitosamente como afiliado de ${cooperative.name}.</p>
      <p>Sus datos de afiliación:</p>
      <ul>
        <li><strong>Documento:</strong> ${affiliate.documentType} ${affiliate.documentNumber}</li>
        <li><strong>Fecha de afiliación:</strong> ${new Date(affiliate.affiliationDate).toLocaleDateString('es-CO')}</li>
      </ul>
      <p>Pronto recibirá información sobre los servicios disponibles y cómo acceder a ellos.</p>
      <p>Gracias por confiar en nosotros.</p>
    `;

    return await this.sendEmail(affiliate.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const subject = 'Recuperación de Contraseña';
    const html = `
      <h2>Recuperación de Contraseña</h2>
      <p>Estimado/a ${user.fullName},</p>
      <p>Hemos recibido una solicitud para restablecer su contraseña.</p>
      <p>Haga clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitó este cambio, ignore este mensaje.</p>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendNotificationEmail(email, subject, message) {
    const html = `
      <h2>${subject}</h2>
      <p>${message}</p>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();

