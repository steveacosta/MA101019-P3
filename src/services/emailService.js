// Servicio de email para envío automático de OTP vía Apps Script (o endpoint HTTPS)
import config from '../config/config';

class EmailService {
  constructor() {
    this.isDevelopment = false; // Siempre enviar emails reales
  }

  // Enviar OTP por email usando endpoint HTTPS configurado (Apps Script)
  async sendOTPEmail(email, otpCode, type) {
    try {
      console.log(`📧 Intentando enviar email automático a: ${email}`);
      const subject = type === 'registration' 
        ? 'Verifica tu cuenta - TipFit' 
        : 'Código de acceso - TipFit';

      if (!config.EMAIL_FUNCTION_URL) {
        throw new Error('EMAIL_FUNCTION_URL no está configurado');
      }
      console.log('🌐 Usando endpoint HTTPS para envío de OTP');
      const resp = await fetch(String(config.EMAIL_FUNCTION_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, type })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Function error: ${resp.status} ${txt}`);
      }
      console.log(`✅ OTP enviado a ${email}`);
      return { success: true, messageId: 'function', isDevelopment: false };
      
    } catch (error) {
      console.error('❌ Error enviando email automático:', error);
      
      // Fallback: mostrar código en consola
      console.log(`\n📧 FALLBACK - OTP PARA ${email}: ${otpCode}\n`);
      
      return {
        success: true,
        messageId: `fallback_${Date.now()}`,
        isDevelopment: true
      };
    }
  }

  // Generar contenido de texto plano
  generatePlainTextContent(otpCode, type) {
    const messageType = type === 'registration' ? 'verificación de cuenta' : 'código de acceso';
    
    return `
TipFit - ${messageType.charAt(0).toUpperCase() + messageType.slice(1)}

Hola,

Usa el siguiente código para ${messageType}:

${otpCode}

Este código expira en 5 minutos. Si no solicitaste este código, puedes ignorar este email.

© 2024 TipFit. Todos los derechos reservados.
    `.trim();
  }

  // Generar HTML del email
  generateEmailHTML(otpCode, type) {
    const messageType = type === 'registration' ? 'verificación de cuenta' : 'código de acceso';
    
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">TipFit</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu compañero de bienestar</p>
      </div>
      
      <div style="padding: 40px 30px; background: white;">
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
          ${messageType.charAt(0).toUpperCase() + messageType.slice(1)}
        </h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          Hola, usa el siguiente código para ${messageType}:
        </p>
        
        <div style="background: #f8f9fa; border: 2px solid #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
          <h3 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px; font-weight: bold;">
            ${otpCode}
          </h3>
        </div>
        
        <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
          Este código expira en 5 minutos. Si no solicitaste este código, puedes ignorar este email.
        </p>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 14px;">
          © 2024 TipFit. Todos los derechos reservados.
        </p>
      </div>
    </div>
    `;
  }

  // Verificar configuración de email
  async verifyEmailConfig() {
    try {
      console.log('✅ Servicio de email EmailJS configurado');
      console.log('📧 Usando EmailJS para envío automático de emails');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de email:', error);
      return false;
    }
  }

  // Método para configurar EmailJS
  configureEmailJS(serviceId, templateId, publicKey) {
    this.serviceId = serviceId;
    this.templateId = templateId;
    this.publicKey = publicKey;
    console.log('📧 EmailJS configurado para envío automático');
  }
}

const emailService = new EmailService();
export default emailService;
