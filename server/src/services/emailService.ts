
import { Queue } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../config/redis';
import { config } from '../config/env';

// Transporter Setup
const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST || 'smtp.gmail.com',
    port: Number(config.SMTP_PORT),
    secure: Number(config.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps with self-signed certs or strict firewall issues
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.warn('⚠️ SMTP Connection Error:', error.message);
    } else {
        console.log('✅ SMTP Server is ready to take messages');
    }
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
            // 1. Notify Sales (Internal)
            await this.sendRawEmail(
                config.SMTP_USER || 'sales@masuma.africa',
                `New Inquiry: ${data.productName}`,
                `<p><strong>Customer:</strong> ${data.name} (${data.phone})</p>
                 <p><strong>Email:</strong> ${data.email}</p>
                 <p><strong>Product:</strong> ${data.productName}</p>
                 <p><strong>Message:</strong><br/>${data.message}</p>`
            );
            
            // 2. Reply to Customer
            if (data.email && data.email.includes('@')) {
                to = data.email;
                subject = `We received your request: ${data.productName}`;
                html = `
                    <p>Jambo ${data.name},</p>
                    <p>We have received your inquiry regarding <strong>${data.productName}</strong>.</p>
                    <p>Our sales team will check availability and pricing and contact you shortly at ${data.phone}.</p>
                    <br/>
                    <p>Regards,<br/>Masuma Autoparts EA Team</p>
                `;
            } else {
                return; // No valid customer email
            }
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
            const info = await transporter.sendMail({
                from: `"Masuma Auto Parts" <${config.FROM_EMAIL}>`,
                to,
                subject,
                html,
            });
            console.log(`Email sent to ${to} (ID: ${info.messageId})`);
        } catch(e: any) {
             console.error(`Email send failed to ${to}:`, e.message);
             throw e; // Re-throw to ensure caller knows it failed
        }
    }
}
