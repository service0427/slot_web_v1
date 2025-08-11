import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function fixEncoding() {
  try {
    console.log('🔧 한글 인코딩 수정 중...');

    // 사용자 이름 수정
    const updates = [
      { email: 'admin@test.com', name: '최고관리자' },
      { email: 'distributor@test.com', name: '테스트총판' },
      { email: 'agency@test.com', name: '테스트대행사' },
      { email: 'user@test.com', name: '홍길동' },
      { email: 'user2@test.com', name: '김철수' },
      { email: 'user3@test.com', name: '이영희' }
    ];

    for (const user of updates) {
      await query(
        'UPDATE users SET full_name = $1 WHERE email = $2',
        [user.name, user.email]
      );
      console.log(`✅ ${user.email}: ${user.name}`);
    }

    console.log('\n🎉 모든 사용자 이름이 수정되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

fixEncoding();