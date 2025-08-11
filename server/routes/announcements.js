import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 공지사항 목록 조회
router.get('/', async (req, res) => {
  try {
    const { type, priority, is_pinned, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_visible = true';
    const params = [];
    let paramCount = 1;

    if (type) {
      whereClause += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    if (priority) {
      whereClause += ` AND priority = $${paramCount++}`;
      params.push(priority);
    }

    if (is_pinned !== undefined) {
      whereClause += ` AND is_pinned = $${paramCount++}`;
      params.push(is_pinned === 'true');
    }

    // 만료되지 않은 공지만
    whereClause += ` AND (expires_at IS NULL OR expires_at > NOW())`;

    params.push(limit, offset);

    const result = await query(
      `SELECT a.*, 
              u.full_name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       ${whereClause}
       ORDER BY 
         is_pinned DESC,
         CASE priority 
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           WHEN 'low' THEN 4
         END,
         created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM announcements a ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      announcements: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: '공지사항 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 공지사항 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, 
              u.full_name as author_name,
              u.email as author_email
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = $1 AND a.is_visible = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
    }

    // 조회수 증가
    await query(
      'UPDATE announcements SET view_count = view_count + 1 WHERE id = $1',
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: '공지사항 조회 중 오류가 발생했습니다.' });
  }
});

// 공지사항 생성 (admin만)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('title').notEmpty(),
    body('content').notEmpty(),
    body('type').optional().isIn(['info', 'warning', 'success', 'error', 'general']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('is_pinned').optional().isBoolean(),
    body('target_audience').optional().isIn(['all', 'admin', 'distributor', 'agency', 'user']),
    body('expires_at').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title, content,
        type = 'info',
        priority = 'normal',
        is_pinned = false,
        target_audience = 'all',
        expires_at
      } = req.body;

      // 공지 코드 생성
      const announcement_code = `ANN${Date.now()}`;

      const result = await query(
        `INSERT INTO announcements (
          announcement_code, title, content, type, priority,
          is_pinned, target_audience, author_id, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          announcement_code, title, content, type, priority,
          is_pinned, target_audience, req.user.id, expires_at
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: '공지사항 생성 중 오류가 발생했습니다.' });
    }
  }
);

// 공지사항 수정 (admin만)
router.put('/:id',
  authenticate,
  authorize('admin'),
  [
    body('title').optional().notEmpty(),
    body('content').optional().notEmpty(),
    body('type').optional().isIn(['info', 'warning', 'success', 'error', 'general']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('is_pinned').optional().isBoolean(),
    body('is_visible').optional().isBoolean(),
    body('expires_at').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 업데이트할 필드 동적 생성
      const updates = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = ['title', 'content', 'type', 'priority', 'is_pinned', 'is_visible', 'target_audience', 'expires_at'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${paramCount++}`);
          values.push(req.body[field]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: '업데이트할 필드가 없습니다.' });
      }

      updates.push('updated_at = NOW()');
      values.push(req.params.id);

      const result = await query(
        `UPDATE announcements 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update announcement error:', error);
      res.status(500).json({ error: '공지사항 수정 중 오류가 발생했습니다.' });
    }
  }
);

// 공지사항 삭제 (admin만)
router.delete('/:id',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const result = await query(
        'DELETE FROM announcements WHERE id = $1 RETURNING id',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '공지사항을 찾을 수 없습니다.' });
      }

      res.json({ message: '공지사항이 삭제되었습니다.', id: result.rows[0].id });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ error: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
  }
);

export default router;