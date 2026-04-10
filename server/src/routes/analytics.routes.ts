import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AnalyticsEvent, AnalyticsEventType } from '../entities/AnalyticsEvent';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { Between } from 'typeorm';

const router = Router();
const eventRepo = AppDataSource.getRepository(AnalyticsEvent);

// Log an event (Public)
router.post('/log', async (req, res) => {
  try {
    const { type, data, visitorId, sessionId, pageUrl, referrer } = req.body;
    
    const event = eventRepo.create({
      type,
      data,
      visitorId,
      sessionId,
      pageUrl,
      referrer,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      // If user is authenticated, we might have req.user but this is a public route
      // We'll handle userId in the frontend if available
      userId: req.body.userId
    });

    await eventRepo.save(event);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Analytics Log Error:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Get analytics stats (Admin)
router.get('/stats', authenticate, authorize([UserRole.ADMIN]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const dateRange = Between(start, end);

    // 1. Total Visitors (Unique visitorId)
    const { totalVisitors } = await eventRepo.createQueryBuilder('event')
      .select('COUNT(DISTINCT event.visitorId)', 'totalVisitors')
      .where('event.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 2. Page Views
    const pageViews = await eventRepo.count({
      where: { type: AnalyticsEventType.PAGE_VIEW, createdAt: dateRange }
    });

    // 3. Most Visited Pages
    const topPages = await eventRepo.createQueryBuilder('event')
      .select('event.pageUrl', 'url')
      .addSelect('COUNT(*)', 'views')
      .where('event.type = :type', { type: AnalyticsEventType.PAGE_VIEW })
      .andWhere('event.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('event.pageUrl')
      .orderBy('views', 'DESC')
      .limit(10)
      .getRawMany();

    // 4. Most Searched Terms
    const topSearches = await eventRepo.createQueryBuilder('event')
      .select("JSON_UNQUOTE(JSON_EXTRACT(event.data, '$.term'))", 'term')
      .addSelect('COUNT(*)', 'count')
      .where('event.type = :type', { type: AnalyticsEventType.SEARCH })
      .andWhere('event.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('term')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // 5. Conversion Rate (Checkout Complete / Checkout Start)
    const checkoutStarts = await eventRepo.count({
      where: { type: AnalyticsEventType.CHECKOUT_START, createdAt: dateRange }
    });
    const checkoutCompletes = await eventRepo.count({
      where: { type: AnalyticsEventType.CHECKOUT_COMPLETE, createdAt: dateRange }
    });

    // 6. Device Distribution
    const devices = await eventRepo.createQueryBuilder('event')
      .select('event.userAgent', 'userAgent')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('event.userAgent')
      .getRawMany();

    // 7. Real-time active users (last 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { activeUsers } = await eventRepo.createQueryBuilder('event')
      .select('COUNT(DISTINCT event.visitorId)', 'activeUsers')
      .where('event.createdAt >= :fiveMinsAgo', { fiveMinsAgo })
      .getRawOne();

    res.json({
      totalVisitors: parseInt(totalVisitors || 0),
      pageViews,
      topPages,
      topSearches: topSearches.filter(s => s.term),
      conversionRate: checkoutStarts > 0 ? (checkoutCompletes / checkoutStarts) * 100 : 0,
      activeUsers: parseInt(activeUsers || 0),
      checkoutStarts,
      checkoutCompletes
    });
  } catch (error) {
    console.error('Analytics Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
