import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function checkData() {
  try {
    console.log('📊 데이터베이스 데이터 확인...\n');

    // 모든 사용자 조회
    const result = await query(
      'SELECT id, email, full_name, length(full_name) as name_length FROM users ORDER BY level'
    );
    
    console.log('사용자 목록:');
    result.rows.forEach(user => {
      console.log(`- ${user.email}: "${user.full_name}" (길이: ${user.name_length})`);
    });
    
    // 한글이 제대로 저장되었는지 확인
    console.log('\n한글 데이터 재저장 테스트:');
    await query(
      "UPDATE users SET full_name = '관리자테스트' WHERE email = 'admin@test.com'"
    );
    
    const testResult = await query(
      "SELECT full_name FROM users WHERE email = 'admin@test.com'"
    );
    
    console.log('업데이트 후:', testResult.rows[0].full_name);
    
    // 원래대로 복구
    await query(
      "UPDATE users SET full_name = '최고관리자' WHERE email = 'admin@test.com'"
    );
    
    console.log('복구 완료');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();