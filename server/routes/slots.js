import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, getClient } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 슬롯 목록 조회 (권한에 따라 필터링)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // 권한에 따른 필터링
    if (req.user.user_role === 'user') {
      // 일반 사용자는 자신의 슬롯만
      whereClause += ` AND s.assigned_user_id = $${paramCount++}`;
      params.push(req.user.id);
    } else if (req.user.user_role === 'agency') {
      // 대행사는 자신과 하위 사용자의 슬롯
      whereClause += ` AND (s.assigned_user_id = $${paramCount++} OR u.parent_id = $${paramCount++})`;
      params.push(req.user.id, req.user.id);
    } else if (req.user.user_role === 'distributor') {
      // 총판은 자신의 계층 내 모든 슬롯
      whereClause += ` AND (s.assigned_user_id = $${paramCount++} OR u.parent_id = $${paramCount++} OR u2.parent_id = $${paramCount++})`;
      params.push(req.user.id, req.user.id, req.user.id);
    }
    // admin은 모든 슬롯 조회 가능 (조건 없음)

    if (status) {
      whereClause += ` AND s.status = $${paramCount++}`;
      params.push(status);
    }

    if (category) {
      whereClause += ` AND s.category = $${paramCount++}`;
      params.push(category);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT s.*, 
              u.full_name as assigned_user_name,
              u.email as assigned_user_email,
              admin.full_name as assigned_by_name,
              sr.current_rank,
              sr.previous_rank,
              sr.rank_change,
              CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL 
                THEN s.end_date - s.start_date
                ELSE 0 
              END as duration_days,
              CASE 
                WHEN s.end_date IS NOT NULL 
                THEN GREATEST(0, s.end_date - CURRENT_DATE)
                ELSE 0 
              END as remaining_days
       FROM slots s
       LEFT JOIN users u ON s.assigned_user_id = u.id
       LEFT JOIN users u2 ON u.parent_id = u2.id
       LEFT JOIN users admin ON s.assigned_by_id = admin.id
       LEFT JOIN (
         SELECT DISTINCT ON (slot_id) * 
         FROM slot_rankings 
         ORDER BY slot_id, checked_at DESC
       ) sr ON s.id = sr.slot_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    // 전체 개수 조회
    const countResult = await query(
      `SELECT COUNT(*) 
       FROM slots s
       LEFT JOIN users u ON s.assigned_user_id = u.id
       LEFT JOIN users u2 ON u.parent_id = u2.id
       ${whereClause}`,
      params.slice(0, -2) // limit, offset 제외
    );

    res.json({
      slots: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: '슬롯 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 슬롯 상세 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, 
              u.full_name as assigned_user_name,
              u.email as assigned_user_email,
              admin.full_name as assigned_by_name,
              sr.current_rank,
              sr.previous_rank,
              sr.rank_change
       FROM slots s
       LEFT JOIN users u ON s.assigned_user_id = u.id
       LEFT JOIN users admin ON s.assigned_by_id = admin.id
       LEFT JOIN (
         SELECT DISTINCT ON (slot_id) * 
         FROM slot_rankings 
         ORDER BY slot_id, checked_at DESC
       ) sr ON s.id = sr.slot_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' });
    }

    const slot = result.rows[0];

    // 권한 체크
    if (req.user.user_role === 'user' && slot.assigned_user_id !== req.user.id) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    res.json(slot);
  } catch (error) {
    console.error('Get slot error:', error);
    res.status(500).json({ error: '슬롯 조회 중 오류가 발생했습니다.' });
  }
});

// 슬롯 생성 (관리자/총판/대행사만)
router.post('/',
  authenticate,
  authorize('admin', 'distributor', 'agency'),
  [
    body('slot_code').notEmpty(),
    body('slot_name').notEmpty(),
    body('keyword').notEmpty(),
    body('url').isURL(),
    body('assigned_user_id').isUUID(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    body('price').optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        slot_code, slot_name, description, keyword, url, thumbnail,
        category = 'basic', work_type = 'marketing',
        assigned_user_id, start_date, end_date, price = 0
      } = req.body;

      // 중복 체크
      const existing = await query(
        'SELECT id FROM slots WHERE slot_code = $1',
        [slot_code]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: '이미 존재하는 슬롯 코드입니다.' });
      }

      // 권한 체크: 하위 사용자에게만 할당 가능
      if (req.user.user_role !== 'admin') {
        const userCheck = await query(
          'SELECT id FROM users WHERE id = $1 AND (parent_id = $2 OR id IN (SELECT id FROM users WHERE parent_id IN (SELECT id FROM users WHERE parent_id = $2)))',
          [assigned_user_id, req.user.id]
        );

        if (userCheck.rows.length === 0) {
          return res.status(403).json({ error: '해당 사용자에게 슬롯을 할당할 권한이 없습니다.' });
        }
      }

      const result = await query(
        `INSERT INTO slots (
          slot_code, slot_name, description, keyword, url, thumbnail,
          category, work_type, assigned_user_id, assigned_by_id,
          start_date, end_date, price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          slot_code, slot_name, description, keyword, url, thumbnail,
          category, work_type, assigned_user_id, req.user.id,
          start_date, end_date, price
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create slot error:', error);
      res.status(500).json({ error: '슬롯 생성 중 오류가 발생했습니다.' });
    }
  }
);

// 슬롯 수정
router.put('/:id',
  authenticate,
  [
    body('keyword').optional(),
    body('url').optional().isURL(),
    body('status').optional().isIn(['pending', 'active', 'completed', 'cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 슬롯 조회 및 권한 체크
      const slotResult = await query(
        'SELECT * FROM slots WHERE id = $1',
        [req.params.id]
      );

      if (slotResult.rows.length === 0) {
        return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' });
      }

      const slot = slotResult.rows[0];

      // 권한 체크
      if (req.user.user_role === 'user' && slot.assigned_user_id !== req.user.id) {
        return res.status(403).json({ error: '수정 권한이 없습니다.' });
      }

      // 업데이트할 필드 동적 생성
      const updates = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = ['keyword', 'url', 'thumbnail', 'description', 'status', 'progress'];
      
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
        `UPDATE slots 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update slot error:', error);
      res.status(500).json({ error: '슬롯 수정 중 오류가 발생했습니다.' });
    }
  }
);

// 슬롯 삭제 (관리자만)
router.delete('/:id',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const result = await query(
        'DELETE FROM slots WHERE id = $1 RETURNING id',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '슬롯을 찾을 수 없습니다.' });
      }

      res.json({ message: '슬롯이 삭제되었습니다.', id: result.rows[0].id });
    } catch (error) {
      console.error('Delete slot error:', error);
      res.status(500).json({ error: '슬롯 삭제 중 오류가 발생했습니다.' });
    }
  }
);

// 슬롯 순위 업데이트
router.post('/:id/ranking',
  authenticate,
  [
    body('current_rank').isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const { current_rank } = req.body;
      const slotId = req.params.id;

      // 이전 순위 조회
      const prevRank = await query(
        `SELECT current_rank 
         FROM slot_rankings 
         WHERE slot_id = $1 
         ORDER BY checked_at DESC 
         LIMIT 1`,
        [slotId]
      );

      const previous_rank = prevRank.rows.length > 0 ? prevRank.rows[0].current_rank : null;
      
      let rank_change = 'new';
      if (previous_rank) {
        if (current_rank < previous_rank) rank_change = 'up';
        else if (current_rank > previous_rank) rank_change = 'down';
        else rank_change = 'stable';
      }

      const result = await query(
        `INSERT INTO slot_rankings (slot_id, current_rank, previous_rank, rank_change)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [slotId, current_rank, previous_rank, rank_change]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update ranking error:', error);
      res.status(500).json({ error: '순위 업데이트 중 오류가 발생했습니다.' });
    }
  }
);

export default router;