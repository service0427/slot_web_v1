import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 사용자 목록 조회 (관리자/총판/대행사)
router.get('/', 
  authenticate,
  authorize('admin', 'distributor', 'agency'),
  async (req, res) => {
    try {
      const { level, status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 1;

      // 권한에 따른 필터링
      if (req.user.user_role === 'agency') {
        // 대행사는 자신의 하위 사용자만
        whereClause += ` AND u.parent_id = $${paramCount++}`;
        params.push(req.user.id);
      } else if (req.user.user_role === 'distributor') {
        // 총판은 자신의 계층 내 모든 사용자
        whereClause += ` AND (u.parent_id = $${paramCount++} OR u.parent_id IN (SELECT id FROM users WHERE parent_id = $${paramCount++}))`;
        params.push(req.user.id, req.user.id);
      }
      // admin은 모든 사용자 조회 가능

      if (level) {
        whereClause += ` AND u.level = $${paramCount++}`;
        params.push(level);
      }

      if (status) {
        whereClause += ` AND u.status = $${paramCount++}`;
        params.push(status);
      }

      params.push(limit, offset);

      const result = await query(
        `SELECT u.id, u.user_code, u.email, u.full_name, u.phone,
                u.level, u.user_role, u.status, u.parent_id,
                u.children_count, u.last_login_at, u.created_at,
                p.full_name as parent_name,
                (SELECT COUNT(*) FROM slots WHERE assigned_user_id = u.id) as slot_count,
                (SELECT COUNT(*) FROM slots WHERE assigned_user_id = u.id AND status = 'active') as active_slot_count,
                COALESCE(ub.cash_balance, 0) as cash_balance,
                COALESCE(ub.point_balance, 0) as free_cash_balance,
                COALESCE(ub.total_balance, 0) as total_balance
         FROM users u
         LEFT JOIN users p ON u.parent_id = p.id
         LEFT JOIN user_balances ub ON u.id = ub.user_id
         ${whereClause}
         ORDER BY u.level, u.created_at DESC
         LIMIT $${paramCount++} OFFSET $${paramCount}`,
        params
      );

      const countResult = await query(
        `SELECT COUNT(*) FROM users u ${whereClause}`,
        params.slice(0, -2)
      );

      res.json({
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
    }
  }
);

// 사용자 상세 조회
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT u.*, 
                p.full_name as parent_name,
                p.email as parent_email,
                (SELECT COUNT(*) FROM users WHERE parent_id = u.id) as children_count,
                (SELECT COUNT(*) FROM slots WHERE assigned_user_id = u.id) as slot_count,
                (SELECT SUM(cash_balance) FROM user_balances WHERE user_id = u.id) as cash_balance
         FROM users u
         LEFT JOIN users p ON u.parent_id = p.id
         WHERE u.id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const user = result.rows[0];
      delete user.password_hash; // 비밀번호 해시 제거

      // 권한 체크
      if (req.user.user_role === 'user' && req.user.id !== user.id) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get user detail error:', error);
      res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
    }
  }
);

// 사용자 생성 (관리자/총판/대행사)
router.post('/',
  authenticate,
  authorize('admin', 'distributor', 'agency'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty(),
    body('user_code').notEmpty(),
    body('phone').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name, user_code, phone } = req.body;

      // 중복 체크
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 OR user_code = $2',
        [email, user_code]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: '이미 존재하는 이메일 또는 사용자 코드입니다.' });
      }

      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(password, 10);

      // 레벨 설정 (생성자보다 1단계 아래)
      const level = Math.min(req.user.level + 1, 4);
      const parent_id = req.user.id;

      const result = await query(
        `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, user_code, email, full_name, level, user_role`,
        [user_code, email, hashedPassword, full_name, phone, parent_id, level]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: '사용자 생성 중 오류가 발생했습니다.' });
    }
  }
);

// 사용자 수정
router.put('/:id',
  authenticate,
  [
    body('full_name').optional().notEmpty(),
    body('phone').optional(),
    body('status').optional().isIn(['active', 'inactive', 'suspended'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 권한 체크
      if (req.user.user_role === 'user' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: '수정 권한이 없습니다.' });
      }

      // 업데이트할 필드 동적 생성
      const updates = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = req.user.user_role === 'admin' 
        ? ['full_name', 'phone', 'status', 'email']
        : ['full_name', 'phone'];
      
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
        `UPDATE users 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, user_code, email, full_name, level, user_role, status`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: '사용자 수정 중 오류가 발생했습니다.' });
    }
  }
);

// 비밀번호 변경
router.post('/:id/password',
  authenticate,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 본인만 변경 가능
      if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: '비밀번호 변경 권한이 없습니다.' });
      }

      const { current_password, new_password } = req.body;

      // 현재 비밀번호 확인
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.params.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const isPasswordValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
      }

      // 새 비밀번호 해시
      const hashedPassword = await bcrypt.hash(new_password, 10);

      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, req.params.id]
      );

      res.json({ message: '비밀번호가 변경되었습니다.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
  }
);

// 하위 사용자 조회
router.get('/:id/children',
  authenticate,
  async (req, res) => {
    try {
      const result = await query(
        `SELECT u.id, u.user_code, u.email, u.full_name, 
                u.level, u.user_role, u.status, u.children_count,
                (SELECT COUNT(*) FROM slots WHERE assigned_user_id = u.id) as slot_count
         FROM users u
         WHERE u.parent_id = $1
         ORDER BY u.created_at DESC`,
        [req.params.id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({ error: '하위 사용자 조회 중 오류가 발생했습니다.' });
    }
  }
);

export default router;