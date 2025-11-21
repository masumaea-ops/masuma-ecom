
import { Queue } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../config/redis';
import { config } from '../config/env';

// Transporter Setup
const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST || 'smtp.gmail.com',
    port: Number(config.SMTP_PORT),
    secure: Number(config.SMTP_PORT) === 465,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
});

// Initialize Queue ONLY if Redis is available
let emailQueue: Queue | null = null;
if (redis) {
    emailQueue = new Queue('email-queue', { connection: redis });
}

export class EmailService {
    
    /**
     * Sends an email. Uses the Queue if Redis is active, otherwise sends immediately.
     */
    static async sendEmail(type: string, data: any) {
        if (emailQueue) {
            // Async Queue Mode
            await emailQueue.add('send-email', { type, data });
            return true;
        } else {
            // Direct Mode (Fallback)
            console.log(`ℹ️ Redis missing. Sending email (${type}) directly...`);
            try {
                // Construct email content locally (simulating worker logic)
                await this.processDirectEmail(type, data);
                return true;
            } catch (error) {
                console.error('Direct Email Failed:', error);
                return false;
            }
        }
    }

    // Logic shared with Worker, but used directly here if no Redis
    static async processDirectEmail(type: string, data: any) {
        let subject = '';
        let html = '';
        let to = data.email;

        if (type === 'ORDER_CONFIRMATION') {
            subject = `Order Confirmation #${data.orderNumber}`;
            html = `
                <h1>Order Received</h1>
                <p>Hi ${data.customerName},</p>
                <p>Thank you for your order #${data.orderNumber}.</p>
                <p>Total: KES ${data.totalAmount}</p>
            `;
        } else if (type === 'QUOTE_REQUEST') {
            // 1. Notify Sales
            await this.sendRawEmail(
                'sales@masuma.africa',
                `New Inquiry: ${data.productName}`,
                `<p>Customer: ${data.name} (${data.phone})</p><p>Msg: ${data.message}</p>`
            );
            
            // 2. Reply to Customer
            to = data.email;
            subject = `We received your request: ${data.productName}`;
            html = `<p>Jambo ${data.name}, we received your inquiry. Our team will contact you shortly.</p>`;
        }

        if (to && subject && html) {
            await this.sendRawEmail(to, subject, html);
        }
    }

    static async sendRawEmail(to: string, subject: string, html: string) {
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
        } catch(e) {
             console.error("Email send failed", e);
        }
    }
}
