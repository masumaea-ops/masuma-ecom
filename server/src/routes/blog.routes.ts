import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { BlogPost } from '../entities/BlogPost';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();
const blogRepo = AppDataSource.getRepository(BlogPost);

// Schema
const blogSchema = z.object({
    title: z.string().min(5),
    excerpt: z.string().min(10),
    content: z.string().min(20),
    image: z.string().url(),
    category: z.string(),
    readTime: z.string(),
    relatedProductCategory: z.string()
});

// GET /api/blog/:id (Public - Single Post)
router.get('/:id', async (req, res) => {
    try {
        const post = await blogRepo.findOneBy({ id: req.params.id });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        const formatted = {
            ...post,
            date: post.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// GET /api/blog (Public - List)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 6; // Default 6 posts per page
        const skip = (page - 1) * limit;

        const [posts, total] = await blogRepo.findAndCount({
            where: { isPublished: true },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });
        
        const formatted = posts.map(p => ({
            ...p,
            date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        res.json({
            data: formatted,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// POST /api/blog (Admin)
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(blogSchema), async (req, res) => {
    try {
        const post = blogRepo.create(req.body);
        await blogRepo.save(post);
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/blog/:id (Admin)
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(blogSchema.partial()), async (req, res) => {
    try {
        const post = await blogRepo.findOneBy({ id: req.params.id });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        blogRepo.merge(post, req.body);
        await blogRepo.save(post);
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/blog/:id (Admin)
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        await blogRepo.delete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

export default router;