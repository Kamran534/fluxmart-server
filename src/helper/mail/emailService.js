import { createTransporter, verifyConnection, emailConfig } from './config.js';
import templateRenderer from './templateRenderer.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConnected = false;
  }

  // Initialize email service
  async initialize() {
    try {
      this.isConnected = await verifyConnection();
      if (this.isConnected) {
        this.transporter = createTransporter();
        console.log(' Email service initialized successfully '.bgGreen.black.bold);
      } else {
        console.log(' Email service initialization failed '.bgRed.white.bold);
      }
      return this.isConnected;
    } catch (error) {
      console.log('Email service error:'.red.bold, error.message);
      return false;
    }
  }

  // Send OTP email
  async sendOTPEmail({ to, name, otp, expiryMinutes = 10, customData = {} }) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    try {
      // Validate required data
      templateRenderer.validateTemplateData('otp', { name, otp });

      // Render template
      const html = await templateRenderer.renderOTP({
        name,
        otp,
        expiryMinutes,
        ...customData
      });

      const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: `OTP Verification - ${emailConfig.companyName}`,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${to}`.green.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(` Failed to send OTP email to ${to}: `.bgRed.white.bold, error.message);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail({ to, name, customData = {} }) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    try {
      // Validate required data
      templateRenderer.validateTemplateData('welcome', { name, email: to });

      // Render template
      const html = await templateRenderer.renderWelcome({
        name,
        email: to,
        ...customData
      });

      const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: `Welcome to ${emailConfig.companyName}! 🎉`,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${to}`.green.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(` Failed to send welcome email to ${to}: `.bgRed.white.bold, error.message);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail({ to, name, resetLink, expiryHours = 1, customData = {} }) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    try {
      // Validate required data
      templateRenderer.validateTemplateData('reset', { name, resetLink });

      // Render template
      const html = await templateRenderer.renderReset({
        name,
        resetLink,
        expiryHours,
        ...customData
      });

      const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: `Password Reset Request - ${emailConfig.companyName}`,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${to}`.green.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(` Failed to send password reset email to ${to}: `.bgRed.white.bold, error.message);
      throw error;
    }
  }

  // Send custom email using EJS template
  async sendCustomEmail({ to, subject, templateName, templateData = {}, customData = {} }) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    try {
      // Render template
      const html = await templateRenderer.renderTemplate(templateName, {
        ...templateData,
        ...customData
      });

      const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: subject,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Custom email sent to ${to}`.green.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(` Failed to send custom email to ${to}: `.bgRed.white.bold, error.message);
      throw error;
    }
  }

  // Send email with raw HTML (backward compatibility)
  async sendRawEmail({ to, subject, html, text }) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: emailConfig.from,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
        console.log(`Raw email sent to ${to}`.green.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(` Failed to send raw email to ${to}: `.bgRed.white.bold, error.message);
      throw error;
    }
  }

  // Send bulk emails
  async sendBulkEmails(emails) {
    if (!this.isConnected) {
      throw new Error('Email service not initialized');
    }

    const results = [];
    const errors = [];

    for (const email of emails) {
      try {
        let result;
        if (email.templateName) {
          result = await this.sendCustomEmail(email);
        } else {
          result = await this.sendRawEmail(email);
        }
        results.push({ email: email.to, success: true, messageId: result.messageId });
      } catch (error) {
        errors.push({ email: email.to, error: error.message });
      }
    }

    return { results, errors, totalSent: results.length, totalErrors: errors.length };
  }

  // Test email service
  async testEmailService() {
    try {
      const testEmail = {
        to: emailConfig.from, // Send to self for testing
        subject: 'Email Service Test',
        templateName: 'welcome',
        templateData: {
          name: 'Test User',
          email: emailConfig.from
        }
      };

      const result = await this.sendCustomEmail(testEmail);
      console.log(' Email service test successful '.bgGreen.black.bold);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(' Email service test failed: '.bgRed.white.bold, error.message);
      return { success: false, error: error.message };
    }
  }

  // Get available templates
  getAvailableTemplates() {
    return templateRenderer.getAvailableTemplates();
  }

  // Preview template (for testing)
  async previewTemplate(templateName, data) {
    try {
      return await templateRenderer.renderTemplate(templateName, data);
    } catch (error) {
      throw new Error(`Failed to preview template: ${error.message}`);
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;