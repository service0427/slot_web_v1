import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, user_code, email, full_name, level, user_role, status FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );
    
    if (result.rows.length === 0) {
      throw new Error();
    }
    
    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: '인증이 필요합니다.' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    
    // 레벨 기반 권한 체크
    const userLevel = req.user.level;
    const userRole = req.user.user_role;
    
    // admin은 모든 권한
    if (userRole === 'admin') {
      return next();
    }
    
    // 허용된 역할 체크
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    
    // 레벨 기반 체크 (낮은 레벨이 더 높은 권한)
    if (allowedRoles.includes('distributor') && userLevel <= 2) {
      return next();
    }
    
    if (allowedRoles.includes('agency') && userLevel <= 3) {
      return next();
    }
    
    res.status(403).json({ error: '권한이 없습니다.' });
  };
};

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// authenticate를 authenticateToken으로도 export
export const authenticateToken = authenticate;