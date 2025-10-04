# Email Service Setup Guide

## Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
FROM_EMAIL=your-email@gmail.com
REPLY_TO_EMAIL=noreply@fluxmart.com
SUPPORT_EMAIL=support@fluxmart.com

# Company Information
COMPANY_NAME=FluxMart
COMPANY_WEBSITE=https://fluxmart.com
```

## Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

## Usage Examples

### Initialize Email Service
```javascript
import emailService from './src/mail/emailService.js';

// Initialize the service
await emailService.initialize();
```

### Send OTP Email (EJS Template)
```javascript
await emailService.sendOTPEmail({
  to: 'user@example.com',
  name: 'John Doe',
  otp: '123456',
  expiryMinutes: 15, // Optional: custom expiry time
  customData: {
    companyName: 'FluxMart Pro' // Optional: override default company name
  }
});
```

### Send Welcome Email (EJS Template)
```javascript
await emailService.sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
  customData: {
    socialLinks: [
      { name: 'Facebook', url: 'https://facebook.com/fluxmart' },
      { name: 'Twitter', url: 'https://twitter.com/fluxmart' }
    ]
  }
});
```

### Send Password Reset Email (EJS Template)
```javascript
await emailService.sendPasswordResetEmail({
  to: 'user@example.com',
  name: 'John Doe',
  resetLink: 'https://fluxmart.com/reset-password?token=abc123',
  expiryHours: 2, // Optional: custom expiry time
  customData: {
    companyName: 'FluxMart Pro'
  }
});
```

### Send Custom Email with EJS Template
```javascript
await emailService.sendCustomEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  templateName: 'welcome', // Use existing EJS template
  templateData: {
    name: 'John Doe',
    email: 'user@example.com'
  },
  customData: {
    socialLinks: [
      { name: 'Instagram', url: 'https://instagram.com/fluxmart' }
    ]
  }
});
```

### Send Raw HTML Email (Backward Compatibility)
```javascript
await emailService.sendRawEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML</h1>',
  text: 'Custom text content'
});
```

### Preview Templates
```javascript
import { templateRenderer } from './src/mail/index.js';

// Preview OTP template
const otpHtml = await templateRenderer.renderOTP({
  name: 'John Doe',
  otp: '123456',
  expiryMinutes: 15
});

// Preview welcome template
const welcomeHtml = await templateRenderer.renderWelcome({
  name: 'Jane Smith',
  email: 'jane@example.com'
});
```

### Test Email Service
```javascript
const result = await emailService.testEmailService();
console.log(result);
```

## Features

- ✅ OTP verification emails
- ✅ Welcome emails
- ✅ Password reset emails
- ✅ Custom email templates
- ✅ Bulk email sending
- ✅ Email service testing
- ✅ Beautiful HTML templates
- ✅ Responsive design
- ✅ Security features
