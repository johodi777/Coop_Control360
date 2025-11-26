const axios = require('axios');
const crypto = require('crypto');
const logger = require('./logger');

class PaymentGatewayService {
  // PayU Integration
  static async processPayUPayment(transaction, affiliate, invoice) {
    try {
      const apiKey = process.env.PAYU_API_KEY;
      const apiSecret = process.env.PAYU_API_SECRET;
      const merchantId = process.env.PAYU_MERCHANT_ID;
      const testMode = process.env.PAYU_TEST_MODE === 'true';

      const baseUrl = testMode 
        ? 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi'
        : 'https://api.payulatam.com/payments-api/4.0/service.cgi';

      const order = {
        accountId: merchantId,
        referenceCode: `INV-${invoice.id}-${Date.now()}`,
        description: invoice.concept,
        signature: this.generatePayUSignature(apiKey, merchantId, transaction.reference, transaction.amount, 'COP'),
        amount: transaction.amount,
        currency: 'COP',
        buyer: {
          merchantBuyerId: affiliate.id.toString(),
          fullName: `${affiliate.firstName} ${affiliate.lastName}`,
          emailAddress: affiliate.email || 'noemail@example.com',
          contactPhone: affiliate.phone || '',
          dniNumber: affiliate.documentNumber
        },
        shippingAddress: {
          street1: affiliate.address || 'N/A',
          city: affiliate.city || 'Bogotá',
          state: affiliate.department || 'Cundinamarca',
          country: 'CO',
          postalCode: '000000'
        }
      };

      const response = await axios.post(baseUrl, order, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        gatewayTransactionId: response.data.transactionResponse?.transactionId,
        reference: order.referenceCode,
        status: response.data.transactionResponse?.state,
        response: response.data
      };
    } catch (error) {
      logger.error('Error procesando pago PayU:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static generatePayUSignature(apiKey, merchantId, referenceCode, amount, currency) {
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // MercadoPago Integration
  static async processMercadoPagoPayment(transaction, affiliate, invoice) {
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const testMode = process.env.MERCADOPAGO_TEST_MODE === 'true';

      const baseUrl = 'https://api.mercadopago.com';

      const preference = {
        items: [
          {
            title: invoice.concept,
            quantity: 1,
            unit_price: parseFloat(transaction.amount),
            currency_id: 'COP'
          }
        ],
        payer: {
          name: affiliate.firstName,
          surname: affiliate.lastName,
          email: affiliate.email || 'noemail@example.com',
          identification: {
            type: affiliate.documentType === 'CC' ? 'CC' : 'CE',
            number: affiliate.documentNumber
          }
        },
        external_reference: `INV-${invoice.id}`,
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/payments/webhook/mercadopago`,
        statement_descriptor: 'COOPCONTROL',
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/pending`
        },
        auto_return: 'approved'
      };

      const response = await axios.post(
        `${baseUrl}/checkout/preferences`,
        preference,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        gatewayTransactionId: response.data.id,
        initPoint: response.data.init_point,
        sandboxInitPoint: response.data.sandbox_init_point,
        status: 'pending',
        response: response.data
      };
    } catch (error) {
      logger.error('Error procesando pago MercadoPago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Procesar pago según la pasarela seleccionada
  static async processPayment(transaction, affiliate, invoice, gatewayName) {
    switch (gatewayName.toLowerCase()) {
      case 'payu':
        return await this.processPayUPayment(transaction, affiliate, invoice);
      case 'mercadopago':
        return await this.processMercadoPagoPayment(transaction, affiliate, invoice);
      case 'nequi':
      case 'daviplata':
        // Para Nequi y Daviplata, generalmente se usa un código QR o número de referencia
        return {
          success: true,
          reference: `REF-${Date.now()}`,
          status: 'pending',
          message: 'Pago pendiente de confirmación'
        };
      default:
        return {
          success: false,
          error: 'Pasarela de pago no soportada'
        };
    }
  }

  // Verificar estado de pago
  static async verifyPaymentStatus(gatewayName, transactionId) {
    try {
      if (gatewayName === 'mercadopago') {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const response = await axios.get(
          `https://api.mercadopago.com/v1/payments/${transactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        return {
          success: true,
          status: response.data.status,
          statusDetail: response.data.status_detail,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Verificación no implementada para esta pasarela'
      };
    } catch (error) {
      logger.error('Error verificando estado de pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentGatewayService;

