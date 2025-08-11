import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function testQuery() {
  try {
    // 먼저 인코딩 설정 확인
    const encodingResult = await query("SHOW client_encoding");
    console.log('Client encoding:', encodingResult.rows[0]);

    // 사용자 조회
    const result = await query(
      'SELECT id, email, full_name, encode(full_name::bytea, \'hex\') as hex_name FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log('User data:', result.rows[0]);
    if (result.rows[0].full_name) {
      console.log('Full name:', result.rows[0].full_name);
      console.log('Full name length:', result.rows[0].full_name.length);
    }
    
    // UTF-8로 재설정 시도
    await query("SET client_encoding = 'UTF8'");
    
    // 다시 조회
    const result2 = await query(
      'SELECT full_name FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    console.log('After UTF8 setting:', result2.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();