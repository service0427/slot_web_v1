import express from 'express';
import { query as dbQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 캐시 충전 요청 목록 조회
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    // 관리자만 접근 가능
    if (req.user.level > 3) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let sqlQuery = `
      SELECT 
        cr.*,
        u.email,
        u.full_name,
        u.user_code,
        u.phone,
        p.full_name as processor_name
      FROM cash_charge_requests cr
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN users p ON cr.processor_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    if (status && status !== 'all') {
      queryParams.push(status);
      sqlQuery += ` AND cr.status = $${queryParams.length}`;
    }
    
    sqlQuery += ` ORDER BY cr.requested_at DESC`;
    
    // Count total
    const countQuery = sqlQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    queryParams.push(limit, offset);
    sqlQuery += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    const result = await dbQuery(sqlQuery, queryParams);
    
    res.json({
      requests: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching cash requests:', error);
    res.status(500).json({ error: 'Failed to fetch cash requests' });
  }
});

// 캐시 충전 요청 생성
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { amount, account_holder } = req.body;
    const free_cash_percentage = 0; // 보너스 없음
    
    const result = await dbQuery(
      `INSERT INTO cash_charge_requests 
       (user_id, amount, status, free_cash_percentage, account_holder, requested_at)
       VALUES ($1, $2, 'pending', $3, $4, NOW())
       RETURNING *`,
      [req.user.id, amount, free_cash_percentage, account_holder]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating cash request:', error);
    res.status(500).json({ error: 'Failed to create cash request' });
  }
});

// 캐시 충전 요청 처리 (승인/거절)
router.patch('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    
    // 관리자만 접근 가능
    if (req.user.level > 3) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 트랜잭션 시작
    await dbQuery('BEGIN');
    
    try {
      // 충전 요청 정보 조회
      const requestResult = await dbQuery(
        'SELECT * FROM cash_charge_requests WHERE id = $1',
        [id]
      );
      
      if (!requestResult.rows[0]) {
        await dbQuery('ROLLBACK');
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const request = requestResult.rows[0];
      
      if (request.status !== 'pending') {
        await dbQuery('ROLLBACK');
        return res.status(400).json({ error: 'Request already processed' });
      }
      
      // 요청 상태 업데이트
      await dbQuery(
        `UPDATE cash_charge_requests 
         SET status = $1, processed_at = NOW(), processor_id = $2, rejection_reason = $3
         WHERE id = $4`,
        [status, req.user.id, rejection_reason, id]
      );
      
      // 승인인 경우 캐시 잔액 업데이트 및 거래 내역 생성
      if (status === 'approved') {
        // user_balances 테이블에서 잔액 업데이트 (유료 캐시만 추가, 보너스 없음)
        await dbQuery(
          `INSERT INTO user_balances (user_id, cash_balance, point_balance)
           VALUES ($2, $1, 0)
           ON CONFLICT (user_id)
           DO UPDATE SET 
             cash_balance = user_balances.cash_balance + $1,
             last_updated = NOW()`,
          [request.amount, request.user_id]
        );
        
        // 충전 거래 내역 생성
        await dbQuery(
          `INSERT INTO cash_history 
           (user_id, transaction_type, amount, balance_type, description, transaction_at)
           VALUES ($1, 'charge', $2, 'paid', '캐시 충전', NOW())`,
          [request.user_id, request.amount]
        );
      }
      
      await dbQuery('COMMIT');
      
      res.json({ success: true, message: `Request ${status}` });
    } catch (error) {
      await dbQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing cash request:', error);
    res.status(500).json({ error: 'Failed to process cash request' });
  }
});

// 거래 내역 조회
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, user_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let sqlQuery = `
      SELECT 
        ch.*,
        u.email,
        u.full_name,
        u.user_code
      FROM cash_history ch
      LEFT JOIN users u ON ch.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // 일반 사용자는 본인 거래만 조회
    if (req.user.level === 4) {
      queryParams.push(req.user.id);
      sqlQuery += ` AND ch.user_id = $${queryParams.length}`;
    } else if (user_id) {
      queryParams.push(user_id);
      sqlQuery += ` AND ch.user_id = $${queryParams.length}`;
    }
    
    if (type && type !== 'all') {
      queryParams.push(type);
      sqlQuery += ` AND ch.transaction_type = $${queryParams.length}`;
    }
    
    if (date_from) {
      queryParams.push(date_from);
      sqlQuery += ` AND ch.transaction_at >= $${queryParams.length}`;
    }
    
    if (date_to) {
      queryParams.push(date_to);
      sqlQuery += ` AND ch.transaction_at <= $${queryParams.length}`;
    }
    
    sqlQuery += ` ORDER BY ch.transaction_at DESC`;
    
    // Count total
    const countQuery = sqlQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await dbQuery(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    queryParams.push(limit, offset);
    sqlQuery += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    const result = await dbQuery(sqlQuery, queryParams);
    
    res.json({
      transactions: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 캐시 통계 조회
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // 관리자만 접근 가능
    if (req.user.level > 3) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 총 매출
    const totalRevenueResult = await dbQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cash_history
      WHERE transaction_type = 'charge'
    `);
    
    // 이번 달 매출
    const monthlyRevenueResult = await dbQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cash_history
      WHERE transaction_type = 'charge'
      AND DATE_TRUNC('month', transaction_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    // 대기 중 요청
    const pendingRequestsResult = await dbQuery(`
      SELECT COUNT(*) as count
      FROM cash_charge_requests
      WHERE status = 'pending'
    `);
    
    // 오늘 거래
    const todayTransactionsResult = await dbQuery(`
      SELECT COUNT(*) as count
      FROM cash_history
      WHERE DATE(transaction_at) = CURRENT_DATE
    `);
    
    // 평균 충전액
    const averageChargeResult = await dbQuery(`
      SELECT COALESCE(AVG(amount), 0) as average
      FROM cash_charge_requests
      WHERE status = 'approved'
    `);
    
    // 전체 사용자
    const totalUsersResult = await dbQuery(`
      SELECT COUNT(*) as count
      FROM users
      WHERE level = 4
    `);
    
    res.json({
      totalRevenue: parseFloat(totalRevenueResult.rows[0].total),
      monthlyRevenue: parseFloat(monthlyRevenueResult.rows[0].total),
      pendingRequests: parseInt(pendingRequestsResult.rows[0].count),
      todayTransactions: parseInt(todayTransactionsResult.rows[0].count),
      averageCharge: parseFloat(averageChargeResult.rows[0].average),
      totalUsers: parseInt(totalUsersResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;