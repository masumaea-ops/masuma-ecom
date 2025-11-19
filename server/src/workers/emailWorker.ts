
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../config/redis';
import { config } from '../config/env';

// Initialize Transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST || 'smtp.gmail.com', // Default fallback
  port: Number(config.SMTP_PORT),
  secure: Number(config.SMTP_PORT) === 465,
  auth: {
    user: config.SMTP_USER || 'user',
    pass: config.SMTP_PASS || 'pass',
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  // If no real credentials, log it (Dev Mode)
  if (!config.SMTP_HOST || !config.SMTP_USER) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Masuma Auto Parts" <${config.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}`, error);
    throw error; // Triggers BullMQ retry
  }
};

export const emailWorker = new Worker('email-queue', async (job) => {
  const { type, data } = job.data;

  if (type === 'ORDER_CONFIRMATION') {
    const html = `
      <h1>Order Received</h1>
      <p>Hi ${data.customerName},</p>
      <p>Thank you for your order #${data.orderNumber}. We are processing it now.</p>
      <p>Total: KES ${data.totalAmount}</p>
    `;
    await sendEmail(data.customerEmail, `Order Confirmation #${data.orderNumber}`, html);
  } 
  else if (type === 'QUOTE_REQUEST') {
    // Notify Sales Team
    const internalHtml = `
      <h2>New Quote Request</h2>
      <p><strong>Customer:</strong> ${data.name} (${data.phone})</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Product Interest:</strong> ${data.productName}</p>
      <p><strong>Message:</strong> ${data.message}</p>
    `;
    await sendEmail(
      'sales@masuma.co.ke',
      `New Inquiry: ${data.productName}`,
      internalHtml
    );
    
    // Auto-reply to Customer
    const customerHtml = `
      <p>Jambo ${data.name},</p>
      <p>We have received your inquiry regarding <strong>${data.productName}</strong>.</p>
      <p>Our sales team at Industrial Area is checking availability and pricing. We will contact you at ${data.phone} shortly.</p>
      <br/>
      <p>Best Regards,<br/>Masuma Autoparts East Africa Ltd</p>
    `;
    await sendEmail(
      data.email,
      `We received your request: ${data.productName}`,
      customerHtml
    );
  }
}, { 
  connection: redis,
  concurrency: 5
});

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed: ${err.message}`);
});
