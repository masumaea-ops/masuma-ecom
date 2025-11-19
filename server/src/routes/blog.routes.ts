
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

// GET /api/blog (Public)
router.get('/', async (req, res) => {
    try {
        const posts = await blogRepo.find({
            where: { isPublished: true },
            order: { createdAt: 'DESC' }
        });
        
        // Map to match frontend type if needed, usually direct map works
        const formatted = posts.map(p => ({
            ...p,
            date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        res.json(formatted);
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
