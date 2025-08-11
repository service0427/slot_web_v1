import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function seedUsers() {
  try {
    console.log('🌱 시작: 테스트 사용자 생성...');

    // 관리자 계정
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await query(
      `INSERT INTO users (user_code, email, password_hash, full_name, phone, level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_code) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         level = EXCLUDED.level
       RETURNING id, email, user_role`,
      ['ADMIN001', 'admin@test.com', adminPassword, '최고관리자', '010-1234-5678', 1, 'active']
    );
    console.log('✅ 관리자 계정 생성:', adminResult.rows[0]);

    const adminId = adminResult.rows[0].id;

    // 총판 계정
    const distributorPassword = await bcrypt.hash('dist123', 10);
    const distResult = await query(
      `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_code) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         parent_id = EXCLUDED.parent_id,
         level = EXCLUDED.level
       RETURNING id, email, user_role`,
      ['DIST001', 'distributor@test.com', distributorPassword, '테스트총판', '010-2222-3333', adminId, 2, 'active']
    );
    console.log('✅ 총판 계정 생성:', distResult.rows[0]);

    const distributorId = distResult.rows[0].id;

    // 대행사 계정
    const agencyPassword = await bcrypt.hash('agency123', 10);
    const agencyResult = await query(
      `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_code) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         parent_id = EXCLUDED.parent_id,
         level = EXCLUDED.level
       RETURNING id, email, user_role`,
      ['AGENCY001', 'agency@test.com', agencyPassword, '테스트대행사', '010-3333-4444', distributorId, 3, 'active']
    );
    console.log('✅ 대행사 계정 생성:', agencyResult.rows[0]);

    const agencyId = agencyResult.rows[0].id;

    // 일반 사용자 계정
    const userPassword = await bcrypt.hash('user123', 10);
    const userResult = await query(
      `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_code) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         parent_id = EXCLUDED.parent_id,
         level = EXCLUDED.level
       RETURNING id, email, user_role`,
      ['USER001', 'user@test.com', userPassword, '홍길동', '010-5555-6666', agencyId, 4, 'active']
    );
    console.log('✅ 사용자 계정 생성:', userResult.rows[0]);

    // 추가 사용자들
    const users = [
      { code: 'USER002', email: 'user2@test.com', name: '김철수', phone: '010-6666-7777', parent: agencyId },
      { code: 'USER003', email: 'user3@test.com', name: '이영희', phone: '010-7777-8888', parent: agencyId },
    ];

    for (const user of users) {
      await query(
        `INSERT INTO users (user_code, email, password_hash, full_name, phone, parent_id, level, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_code) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           parent_id = EXCLUDED.parent_id
         RETURNING id, email`,
        [user.code, user.email, userPassword, user.name, user.phone, user.parent, 4, 'active']
      );
      console.log(`✅ 추가 사용자 생성: ${user.email}`);
    }

    console.log('\n🎉 모든 테스트 사용자 생성 완료!');
    console.log('\n📋 로그인 정보:');
    console.log('  관리자: admin@test.com / admin123');
    console.log('  총판: distributor@test.com / dist123');
    console.log('  대행사: agency@test.com / agency123');
    console.log('  사용자: user@test.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

seedUsers();