import { Queue } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../config/redis';
import { config } from '../config/env';

const smtpConfig = {
    host: config.SMTP_HOST || 'smtp.gmail.com',
    port: Number(config.SMTP_PORT) || 587,
    secure: Number(config.SMTP_PORT) === 465,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false 
    }
};

const transporter = nodemailer.createTransport(smtpConfig);

const getFromAddress = () => {
    const from = config.FROM_EMAIL || config.SMTP_USER || 'noreply@masuma.africa';
    if (!from.includes('@')) {
        return `"${from}" <${config.SMTP_USER}>`;
    }
    return from;
};

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ [SMTP] Connection Error:', error.message);
    } else {
        console.log('✅ [SMTP] Connection Verified. Server is ready.');
    }
});

let emailQueue: Queue | null = null;
if (redis && process.env.DISABLE_EMAIL_QUEUE !== 'true') {
    emailQueue = new Queue('email-queue', { connection: redis });
}

export class EmailService {
    
    static async sendEmail(type: string, data: any) {
        if (emailQueue) {
            console.log(`[EMAIL] Queuing ${type} to ${data.email || 'Admin'}...`);
            await emailQueue.add('send-email', { type, data });
            return true;
        } else {
            console.log(`ℹ️ [EMAIL] Queue disabled. Sending ${type} directly...`);
            try {
                return await this.processDirectEmail(type, data);
            } catch (error) {
                console.error('❌ [EMAIL] Direct Send Failed:', error);
                return false;
            }
        }
    }

    static async processDirectEmail(type: string, data: any) {
        let subject = '';
        let html = '';
        let to = data.email;

        if (type === 'ORDER_CONFIRMATION') {
            subject = `Order Confirmation #${data.orderNumber} - Masuma Autoparts EA`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #E0621B;">Jambo ${data.customerName}!</h2>
                    <p>We've received your payment and your order is now being processed.</p>
                    <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
                        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                        <p><strong>Total Paid:</strong> KES ${Number(data.totalAmount).toLocaleString()}</p>
                        <p><strong>Status:</strong> PAID / PROCESSING</p>
                    </div>
                    <p>Our team at Ruby Mall is preparing your parts for dispatch. You will receive another email once your shipment is on the way.</p>
                    <p>Regards,<br/><strong>Masuma Autoparts East Africa Limited</strong></p>
                </div>
            `;
        } else if (type === 'SHIPMENT_DISPATCHED') {
            subject = `Your Order #${data.orderNumber} is on the way!`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #E0621B;">Good News!</h2>
                    <p>Hi ${data.customerName}, your order <strong>#${data.orderNumber}</strong> has been dispatched from our Nairobi warehouse.</p>
                    <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #E0621B;">
                        <p><strong>Delivery Method:</strong> Standard Dispatch</p>
                        <p><strong>Destination:</strong> ${data.shippingAddress || 'Nairobi Region'}</p>
                    </div>
                    <p>Our rider/driver will contact you at <strong>${data.customerPhone}</strong> upon arrival.</p>
                    <p>Thank you for choosing Masuma Japanese precision.</p>
                    <p>Regards,<br/><strong>Masuma Logistics Team</strong></p>
                </div>
            `;
        } else if (type === 'QUOTE_REQUEST') {
            await this.sendRawEmail(
                config.SMTP_USER || 'sales@masuma.africa',
                `New Inquiry: ${data.productName}`,
                `<p><strong>Customer:</strong> ${data.name} (${data.phone})</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Product:</strong> ${data.productName}</p><p><strong>Message:</strong><br/>${data.message}</p>`
            );
            
            if (data.email && data.email.includes('@')) {
                to = data.email;
                subject = `We received your request: ${data.productName}`;
                html = `<p>Jambo ${data.name},</p><p>We have received your inquiry regarding <strong>${data.productName}</strong>.</p><br/><p>Regards,<br/>Masuma Autoparts EA Team</p>`;
            } else return true;
        } else if (type === 'PASSWORD_RESET') {
            subject = 'Reset Your Masuma ERP Password';
            const resetUrl = `${data.origin}/?view=RESET_PASSWORD&token=${data.token}`;
            html = `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #E0621B;">Password Reset</h2>
                    <p>You requested a password reset for the Masuma Autoparts ERP.</p>
                    <a href="${resetUrl}" style="background: #1A1A1A; color: white; padding: 10px 20px; text-decoration: none; display: inline-block;">Reset Password</a>
                    <p style="font-size: 10px; color: #999; margin-top: 20px;">Link: ${resetUrl}</p>
                </div>
            `;
        }

        if (to && subject && html) {
            return await this.sendRawEmail(to, subject, html);
        }
        return false;
    }

    static async sendRawEmail(to: string, subject: string, html: string) {
        if (!config.SMTP_HOST || !config.SMTP_USER) {
            console.error('⚠️ [SMTP] Missing credentials in .env');
            return false;
        }
        try {
            const from = getFromAddress();
            console.log(`📧 [SMTP] Delivering to: ${to} from: ${from}`);
            const info = await transporter.sendMail({
                from,
                to,
                subject,
                html,
            });
            console.log(`✅ [SMTP] Success: ${info.messageId}`);
            return true;
        } catch(e: any) {
             console.error(`❌ [SMTP] Delivery Failed to ${to}:`, e.message);
             throw e;
        }
    }
}