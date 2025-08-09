const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    try {
      // Development: Use Ethereal Email for testing
      if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        console.log('📧 Email service initialized with Ethereal Email for development');
        console.log(`📧 Preview emails at: https://ethereal.email`);
      } else {
        // Production: Use configured SMTP settings
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            ciphers: 'SSLv3'
          }
        });
        
        console.log('📧 Email service initialized with configured SMTP');
      }

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw new Error('Email service configuration failed');
    }
  }

  // Generate secure tokens
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send verification email
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'W.E.T Team',
        address: process.env.EMAIL_FROM || 'noreply@wet-eyetracking.com'
      },
      to: user.email,
      subject: 'Verify Your W.E.T Account Email',
      html: this.getVerificationEmailTemplate(user, verificationUrl),
      text: `
Hello ${user.firstName},

Welcome to W.E.T (Webcam Eye Tracking)!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The W.E.T Team
      `.trim()
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Verification email sent:', info.messageId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'W.E.T Team',
        address: process.env.EMAIL_FROM || 'noreply@wet-eyetracking.com'
      },
      to: user.email,
      subject: 'Reset Your W.E.T Account Password',
      html: this.getPasswordResetEmailTemplate(user, resetUrl),
      text: `
Hello ${user.firstName},

You requested to reset your password for your W.E.T account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The W.E.T Team
      `.trim()
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Password reset email sent:', info.messageId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(user) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    const mailOptions = {
      from: {
        name: 'W.E.T Team',
        address: process.env.EMAIL_FROM || 'noreply@wet-eyetracking.com'
      },
      to: user.email,
      subject: 'Welcome to W.E.T - Your Account is Ready!',
      html: this.getWelcomeEmailTemplate(user, loginUrl),
      text: `
Hello ${user.firstName},

Welcome to W.E.T (Webcam Eye Tracking)!

Your account has been successfully verified and is now ready to use.

You can now:
• Download the W.E.T software
• Access premium features (if subscribed)
• Sync your data across devices
• Get priority support

Get started: ${loginUrl}

If you have any questions, don't hesitate to contact our support team.

Best regards,
The W.E.T Team
      `.trim()
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Welcome email sent:', info.messageId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw here as this is not critical
      return { success: false, error: error.message };
    }
  }

  // Email templates
  getVerificationEmailTemplate(user, verificationUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your W.E.T Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #0c0f17; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="background: linear-gradient(135deg, #00c8ff, #5865f2, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; font-weight: 700; margin-bottom: 8px;">W.E.T</div>
      <div style="color: #8b949e; font-size: 14px;">Webcam Eye Tracking</div>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">Verify Your Email Address</h1>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hello ${user.firstName},</p>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
        Welcome to W.E.T! To complete your account setup and start using our webcam eye tracking technology, please verify your email address by clicking the button below.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #00c8ff, #5865f2); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
      </div>

      <p style="color: #8b949e; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        This verification link will expire in 24 hours. If you didn't create an account with W.E.T, you can safely ignore this email.
      </p>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 32px;">
        <p style="color: #8b949e; font-size: 12px; line-height: 1.5; margin: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #58a6ff; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6e7681; font-size: 12px;">
      <p style="margin: 0;">© 2024 W.E.T - Webcam Eye Tracking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getPasswordResetEmailTemplate(user, resetUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your W.E.T Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #0c0f17; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="background: linear-gradient(135deg, #00c8ff, #5865f2, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; font-weight: 700; margin-bottom: 8px;">W.E.T</div>
      <div style="color: #8b949e; font-size: 14px;">Webcam Eye Tracking</div>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">Reset Your Password</h1>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hello ${user.firstName},</p>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
        We received a request to reset the password for your W.E.T account. Click the button below to create a new password.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #5865f2); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>

      <p style="color: #8b949e; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        This password reset link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email and your password will remain unchanged.
      </p>

      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 32px;">
        <p style="color: #8b949e; font-size: 12px; line-height: 1.5; margin: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #58a6ff; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6e7681; font-size: 12px;">
      <p style="margin: 0;">© 2024 W.E.T - Webcam Eye Tracking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  getWelcomeEmailTemplate(user, loginUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to W.E.T!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #0c0f17; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="background: linear-gradient(135deg, #00c8ff, #5865f2, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; font-weight: 700; margin-bottom: 8px;">W.E.T</div>
      <div style="color: #8b949e; font-size: 14px;">Webcam Eye Tracking</div>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">Welcome to W.E.T! 🎉</h1>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hello ${user.firstName},</p>
      
      <p style="color: #c9d1d9; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Your W.E.T account has been successfully verified and is ready to use! You now have access to our advanced webcam eye tracking technology.
      </p>

      <div style="background: rgba(0, 200, 255, 0.1); border: 1px solid rgba(0, 200, 255, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #00c8ff; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">What you can do now:</h3>
        <ul style="color: #c9d1d9; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Download the W.E.T software for your platform</li>
          <li style="margin-bottom: 8px;">Access premium features and updates</li>
          <li style="margin-bottom: 8px;">Sync your data across devices</li>
          <li style="margin-bottom: 8px;">Get priority technical support</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #00c8ff, #5865f2); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">Get Started</a>
      </div>

      <p style="color: #8b949e; font-size: 14px; line-height: 1.6; margin-bottom: 16px; text-align: center;">
        Questions? Contact our support team anytime - we're here to help!
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #6e7681; font-size: 12px;">
      <p style="margin: 0;">© 2024 W.E.T - Webcam Eye Tracking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
