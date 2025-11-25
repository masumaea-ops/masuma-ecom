
import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { EmailService } from '../services/emailService';

declare const require: any;
declare const module: any;

export const startEmailWorker = () => {
    if (!redis) {
        console.log('⚠️ Redis unavailable. Background Email Worker not started.');
        return;
    }

    const emailWorker = new Worker('email-queue', async (job) => {
        const { type, data } = job.data;
        // Reuse the direct processing logic from the service to avoid duplication
        await EmailService.processDirectEmail(type, data);
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

    console.log('📧 Email Background Worker Started');
};

// Start immediately if run standalone
if (require.main === module) {
    startEmailWorker();
}
