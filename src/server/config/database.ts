import { Pool } from 'pg';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// PostgreSQL 연결 풀 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'slot_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  
  // 연결 풀 설정
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  
  // SSL 설정 (프로덕션 환경)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false
});

// 연결 테스트
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL 연결 성공:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 연결 실패:', error);
    return false;
  }
};

// 데이터베이스 초기화
export const initDatabase = async (): Promise<void> => {
  try {
    // UUID 확장 기능 활성화
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID 확장 기능 활성화');
    
    // 연결 테스트
    await testConnection();
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    throw error;
  }
};

// 트랜잭션 헬퍼
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 쿼리 실행 헬퍼
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 디버그 모드에서 쿼리 로깅
    if (process.env.DEBUG === 'true') {
      console.log('쿼리 실행:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('쿼리 실행 오류:', error);
    throw error;
  }
};

// 단일 결과 조회
export const queryOne = async (text: string, params?: any[]) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

// 다중 결과 조회
export const queryMany = async (text: string, params?: any[]) => {
  const result = await query(text, params);
  return result.rows;
};

// 연결 풀 종료
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('✅ PostgreSQL 연결 풀 종료');
};

export default pool;