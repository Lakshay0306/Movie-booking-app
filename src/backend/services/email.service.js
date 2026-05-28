// src/services/email.service.js
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter;

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER || 'user',
          pass: process.env.SMTP_PASSWORD || 'password'
        }
      });
    }

    // Generate basic HTML templates based on requested template
    let htmlContent = `<h1>${subject}</h1>`;
    if (template === 'verify-email') {
      htmlContent += `<p>Hello ${data.firstName || ''},</p><p>Please click the link below to verify your email address:</p><p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>`;
    } else if (template === 'reset-password') {
      htmlContent += `<p>Hello ${data.firstName || ''},</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${data.resetUrl}">${data.resetUrl}</a></p>`;
    } else if (template === 'booking-confirmation') {
      htmlContent += `<p>Hello ${data.firstName || ''},</p><p>Your booking with reference <strong>${data.bookingReference}</strong> has been successfully confirmed!</p><p>Total Paid: ₹${data.totalAmount}</p><p>Enjoy the movie!</p>`;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cineverse.com',
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    // Don't throw to avoid blocking critical flows if SMTP not configured live
    return null;
  }
};
