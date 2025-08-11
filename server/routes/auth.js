import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

// 회원가입
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty(),
    body('user_code').notEmpty(),
    body('phone').optional(),
    body('parent_id').optional().isUUID(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, full_name, user_code, phone, parent_id } = req.body;

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

      // parent_id가 있으면 부모의 레벨 확인
      let level = 4; // 기본값
      if (parent_id) {
        const parentResult = await query('SELECT level FROM users WHERE id = $1', [parent_id]);
        if (parentResult.rows.length > 0) {
          level = parentResult.rows[0].level + 1;
          if (level > 4) level = 4; // 최대 레벨 4
        }
      }

      // 사용자 생성
      const result = await query(
        `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level, cash_balance, free_cash_balance) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0) 
         RETURNING id, user_code, email, full_name, level, user_role, cash_balance, free_cash_balance`,
        [user_code, email, hashedPassword, full_name, phone, parent_id, level]
      );

      const user = result.rows[0];
      const token = generateToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          user_code: user.user_code,
          email: user.email,
          full_name: user.full_name,
          level: user.level,
          role: user.user_role,
          cash_balance: user.cash_balance || 0,
          free_cash_balance: user.free_cash_balance || 0
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
    }
  }
);

// 로그인
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // 사용자 조회
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND status = $2',
        [email, 'active']
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }

      const user = result.rows[0];

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 마지막 로그인 시간 업데이트
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      const token = generateToken(user.id);

      res.json({
        user: {
          id: user.id,
          user_code: user.user_code,
          email: user.email,
          full_name: user.full_name,
          level: user.level,
          role: user.user_role,
          parent_id: user.parent_id,
          cash_balance: user.cash_balance || 0,
          free_cash_balance: user.free_cash_balance || 0
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
    }
  }
);

// 현재 사용자 정보
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, 
              p.full_name as parent_name,
              (SELECT COUNT(*) FROM users WHERE parent_id = u.id) as children_count,
              COALESCE(ub.cash_balance, 0) as cash_balance,
              COALESCE(ub.point_balance, 0) as free_cash_balance,
              COALESCE(ub.total_balance, 0) as total_balance
       FROM users u
       LEFT JOIN users p ON u.parent_id = p.id
       LEFT JOIN user_balances ub ON u.id = ub.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = result.rows[0];
    delete user.password_hash; // 비밀번호 해시 제거

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

// 로그아웃 (프론트엔드에서 토큰 삭제)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '로그아웃되었습니다.' });
});

export default router;