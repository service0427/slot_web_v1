import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// 라우트 임포트
import authRoutes from './routes/auth.js';
import slotsRoutes from './routes/slots.js';
import inquiriesRoutes from './routes/inquiries.js';
import announcementsRoutes from './routes/announcements.js';
import usersRoutes from './routes/users.js';
import cashRoutes from './routes/cash.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cash', cashRoutes);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 데이터베이스 연결 실패. 서버를 종료합니다.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`
========================================
🚀 서버가 시작되었습니다!
========================================
📍 주소: http://localhost:${PORT}
📊 환경: ${process.env.NODE_ENV || 'development'}
🔗 프론트엔드: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
========================================
      `);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});