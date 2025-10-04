import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { emailConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateRenderer {
  constructor() {
    this.templateDir = path.join(__dirname, 'templates');
  }

  // Render OTP template
  async renderOTP(data) {
    const templatePath = path.join(this.templateDir, 'otp.ejs');
    const templateData = {
      ...data,
      companyName: data.companyName || emailConfig.companyName,
      companyWebsite: data.companyWebsite || emailConfig.companyWebsite,
      supportEmail: data.supportEmail || emailConfig.supportEmail,
      expiryMinutes: data.expiryMinutes || 10
    };

    try {
      return await ejs.renderFile(templatePath, templateData);
    } catch (error) {
      throw new Error(`Failed to render OTP template: ${error.message}`);
    }
  }

  // Render welcome template
  async renderWelcome(data) {
    const templatePath = path.join(this.templateDir, 'welcome.ejs');
    const templateData = {
      ...data,
      companyName: data.companyName || emailConfig.companyName,
      companyWebsite: data.companyWebsite || emailConfig.companyWebsite,
      supportEmail: data.supportEmail || emailConfig.supportEmail,
      socialLinks: data.socialLinks || null
    };

    try {
      return await ejs.renderFile(templatePath, templateData);
    } catch (error) {
      throw new Error(`Failed to render welcome template: ${error.message}`);
    }
  }

  // Render password reset template
  async renderReset(data) {
    const templatePath = path.join(this.templateDir, 'reset.ejs');
    const templateData = {
      ...data,
      companyName: data.companyName || emailConfig.companyName,
      companyWebsite: data.companyWebsite || emailConfig.companyWebsite,
      supportEmail: data.supportEmail || emailConfig.supportEmail,
      expiryHours: data.expiryHours || 1
    };

    try {
      return await ejs.renderFile(templatePath, templateData);
    } catch (error) {
      throw new Error(`Failed to render reset template: ${error.message}`);
    }
  }

  // Generic template renderer
  async renderTemplate(templateName, data) {
    const templatePath = path.join(this.templateDir, `${templateName}.ejs`);
    const templateData = {
      ...data,
      companyName: data.companyName || emailConfig.companyName,
      companyWebsite: data.companyWebsite || emailConfig.companyWebsite,
      supportEmail: data.supportEmail || emailConfig.supportEmail
    };

    try {
      return await ejs.renderFile(templatePath, templateData);
    } catch (error) {
      throw new Error(`Failed to render ${templateName} template: ${error.message}`);
    }
  }

  // Render custom template with additional data
  async renderCustomTemplate(templateName, data, additionalData = {}) {
    const templatePath = path.join(this.templateDir, `${templateName}.ejs`);
    const templateData = {
      ...data,
      ...additionalData,
      companyName: data.companyName || emailConfig.companyName,
      companyWebsite: data.companyWebsite || emailConfig.companyWebsite,
      supportEmail: data.supportEmail || emailConfig.supportEmail
    };

    try {
      return await ejs.renderFile(templatePath, templateData);
    } catch (error) {
      throw new Error(`Failed to render custom ${templateName} template: ${error.message}`);
    }
  }

  // Get available templates
  getAvailableTemplates() {
    return ['otp', 'welcome', 'reset'];
  }

  // Validate template data
  validateTemplateData(templateName, data) {
    const requiredFields = {
      otp: ['name', 'otp'],
      welcome: ['name', 'email'],
      reset: ['name', 'resetLink']
    };

    const required = requiredFields[templateName] || [];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields for ${templateName} template: ${missing.join(', ')}`);
    }

    return true;
  }
}

// Create singleton instance
const templateRenderer = new TemplateRenderer();

export default templateRenderer;
