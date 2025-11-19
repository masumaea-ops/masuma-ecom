
import { Worker } from 'bullmq';
import { redis } from '../config/redis';

// Mock email sender
const sendEmail = async (to: string, subject: string, body: string) => {
  // In production, integrate with SendGrid, AWS SES, or Postmark
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
  // console.log(`Body: ${body}`);
  return new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
};

export const emailWorker = new Worker('email-queue', async (job) => {
  const { type, data } = job.data;

  if (type === 'ORDER_CONFIRMATION') {
    await sendEmail(
      data.customerEmail, 
      `Order Confirmation #${data.orderId}`,
      `Thank you ${data.customerName}, we have received your order.`
    );
  } 
  else if (type === 'QUOTE_REQUEST') {
    // Notify Sales Team
    await sendEmail(
      'sales@masuma.co.ke',
      `New Quote Request: ${data.productName}`,
      `Customer: ${data.name} (${data.phone})\nProduct: ${data.productName} (ID: ${data.productId})\nMessage: ${data.message}`
    );
    
    // Ack to Customer (Optional)
    await sendEmail(
      data.email,
      `We received your quote request for ${data.productName}`,
      `Hi ${data.name},\n\nWe received your inquiry. Our team is checking stock and pricing and will call you at ${data.phone} shortly.\n\nMasuma Team`
    );
  }
}, { 
  connection: redis 
});

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed: ${err.message}`);
});
