import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { EmailService } from '../services/emailService';

export const startEmailWorker = () => {
    if (!redis) {
        console.log('⚠️ [WORKER] Redis unavailable. Email Worker not started.');
        return;
    }

    console.log('📧 [WORKER] Initializing Email Background Worker...');

    const emailWorker = new Worker('email-queue', async (job) => {
        console.log(`📥 [WORKER] Processing Job ${job.id} (Type: ${job.data.type})...`);
        try {
            const { type, data } = job.data;
            await EmailService.processDirectEmail(type, data);
            console.log(`✨ [WORKER] Job ${job.id} finished processing.`);
        } catch (err: any) {
            console.error(`🔥 [WORKER] Job ${job.id} logic error:`, err.message);
            throw err; // Re-throw to trigger BullMQ fail listener
        }
    }, { 
        connection: redis,
        concurrency: 5,
        // Ensure worker doesn't stall on closed connections
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 1000 }
    });

    emailWorker.on('ready', () => {
        console.log('✅ [WORKER] Email Queue Worker is READY and listening.');
    });

    emailWorker.on('completed', (job) => {
        console.log(`✅ [WORKER] Job ${job.id} marked COMPLETED.`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`❌ [WORKER] Job ${job?.id} FAILED:`, err.message);
    });

    emailWorker.on('error', (err) => {
        console.error('🚨 [WORKER] Fatal Worker Error:', err);
    });
};
