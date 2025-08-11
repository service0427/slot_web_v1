import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 문의 목록 조회
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // 일반 사용자는 자신의 문의만
    if (req.user.user_role === 'user') {
      whereClause += ` AND i.user_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (status) {
      whereClause += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT i.*, 
              u.full_name as user_name,
              u.email as user_email,
              a.full_name as admin_name,
              (SELECT COUNT(*) FROM inquiry_messages WHERE inquiry_id = i.id AND is_read = false) as unread_count,
              (SELECT message FROM inquiry_messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN users a ON i.assigned_admin_id = a.id
       ${whereClause}
       ORDER BY 
         CASE WHEN i.status = 'open' THEN 0 ELSE 1 END,
         i.priority = 'urgent' DESC,
         i.priority = 'high' DESC,
         i.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM inquiries i ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      inquiries: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: '문의 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 문의 생성
router.post('/',
  authenticate,
  [
    body('title').notEmpty(),
    body('category').optional(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('message').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, category = 'general', priority = 'normal', message } = req.body;

      // 문의 코드 생성
      const inquiry_code = `INQ${Date.now()}`;

      // 트랜잭션으로 문의와 첫 메시지 생성
      const client = await query('BEGIN');
      
      try {
        // 문의 생성
        const inquiryResult = await query(
          `INSERT INTO inquiries (inquiry_code, user_id, title, category, priority)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [inquiry_code, req.user.id, title, category, priority]
        );

        const inquiry = inquiryResult.rows[0];

        // 첫 메시지 생성
        await query(
          `INSERT INTO inquiry_messages (inquiry_id, sender_id, sender_type, message)
           VALUES ($1, $2, $3, $4)`,
          [inquiry.id, req.user.id, 'user', message]
        );

        // 마지막 메시지 시간 업데이트
        await query(
          'UPDATE inquiries SET last_message_at = NOW() WHERE id = $1',
          [inquiry.id]
        );

        await query('COMMIT');

        res.status(201).json(inquiry);
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Create inquiry error:', error);
      res.status(500).json({ error: '문의 생성 중 오류가 발생했습니다.' });
    }
  }
);

// 문의 상세 및 메시지 조회
router.get('/:id', authenticate, async (req, res) => {
  try {
    // 문의 조회
    const inquiryResult = await query(
      `SELECT i.*, 
              u.full_name as user_name,
              u.email as user_email,
              a.full_name as admin_name
       FROM inquiries i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN users a ON i.assigned_admin_id = a.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    }

    const inquiry = inquiryResult.rows[0];

    // 권한 체크
    if (req.user.user_role === 'user' && inquiry.user_id !== req.user.id) {
      return res.status(403).json({ error: '접근 권한이 없습니다.' });
    }

    // 메시지 조회
    const messagesResult = await query(
      `SELECT m.*, 
              u.full_name as sender_name,
              u.email as sender_email
       FROM inquiry_messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.inquiry_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    // 읽음 처리
    const senderType = req.user.user_role === 'user' ? 'admin' : 'user';
    await query(
      `UPDATE inquiry_messages 
       SET is_read = true, read_at = NOW()
       WHERE inquiry_id = $1 AND sender_type = $2 AND is_read = false`,
      [req.params.id, senderType]
    );

    res.json({
      inquiry,
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Get inquiry detail error:', error);
    res.status(500).json({ error: '문의 조회 중 오류가 발생했습니다.' });
  }
});

// 메시지 전송
router.post('/:id/messages',
  authenticate,
  [
    body('message').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const inquiryId = req.params.id;
      const { message } = req.body;

      // 문의 확인
      const inquiryResult = await query(
        'SELECT * FROM inquiries WHERE id = $1',
        [inquiryId]
      );

      if (inquiryResult.rows.length === 0) {
        return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
      }

      const inquiry = inquiryResult.rows[0];

      // 권한 체크
      if (req.user.user_role === 'user' && inquiry.user_id !== req.user.id) {
        return res.status(403).json({ error: '메시지 전송 권한이 없습니다.' });
      }

      const senderType = req.user.user_role === 'user' ? 'user' : 'admin';

      // 메시지 생성
      const messageResult = await query(
        `INSERT INTO inquiry_messages (inquiry_id, sender_id, sender_type, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [inquiryId, req.user.id, senderType, message]
      );

      // 문의 상태 및 담당자 업데이트
      if (senderType === 'admin' && !inquiry.assigned_admin_id) {
        await query(
          `UPDATE inquiries 
           SET assigned_admin_id = $1, status = 'in_progress', last_message_at = NOW()
           WHERE id = $2`,
          [req.user.id, inquiryId]
        );
      } else {
        await query(
          'UPDATE inquiries SET last_message_at = NOW() WHERE id = $1',
          [inquiryId]
        );
      }

      res.json(messageResult.rows[0]);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: '메시지 전송 중 오류가 발생했습니다.' });
    }
  }
);

// 문의 상태 변경 (관리자만)
router.patch('/:id/status',
  authenticate,
  authorize('admin', 'distributor', 'agency'),
  [
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status } = req.body;
      const updateData = { status };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = 'NOW()';
      }

      const result = await query(
        `UPDATE inquiries 
         SET status = $1, 
             resolved_at = ${status === 'resolved' || status === 'closed' ? 'NOW()' : 'resolved_at'},
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update inquiry status error:', error);
      res.status(500).json({ error: '문의 상태 변경 중 오류가 발생했습니다.' });
    }
  }
);

export default router;