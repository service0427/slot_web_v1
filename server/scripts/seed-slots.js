import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function seedSlots() {
  try {
    console.log('🎰 시작: 테스트 슬롯 데이터 생성...');

    // 사용자 ID 가져오기
    const usersResult = await query(
      `SELECT id, full_name, level FROM users ORDER BY level, created_at`
    );
    
    const users = usersResult.rows;
    const admin = users.find(u => u.level === 1);
    const distributor = users.find(u => u.level === 2);
    const agency = users.find(u => u.level === 3);
    const normalUsers = users.filter(u => u.level === 4);

    if (!admin || !normalUsers.length) {
      console.error('❌ 사용자 데이터가 없습니다. 먼저 사용자를 생성해주세요.');
      process.exit(1);
    }

    // 슬롯 데이터 생성 (단순화)
    const slots = [
      {
        slot_code: 'SLOT001',
        slot_name: '네이버 카페 상위노출',
        description: '네이버 카페 포스팅 상위노출 작업',
        keyword: '부동산 투자',
        url: 'https://cafe.naver.com/example1',
        assigned_user_id: normalUsers[0]?.id,
        assigned_by_id: admin.id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        status: 'active'
      },
      {
        slot_code: 'SLOT002',
        slot_name: '구글 SEO 최적화',
        description: '구글 검색 순위 상승을 위한 SEO 작업',
        keyword: '온라인 마케팅',
        url: 'https://example-company.com',
        assigned_user_id: normalUsers[1]?.id,
        assigned_by_id: agency?.id || admin.id,
        start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10일 전
        end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20일 후
        status: 'active'
      },
      {
        slot_code: 'SLOT003',
        slot_name: '블로그 트래픽 증가',
        description: '티스토리 블로그 방문자 증가 프로젝트',
        keyword: '여행 블로그',
        url: 'https://travel-blog.tistory.com',
        assigned_user_id: normalUsers[2]?.id,
        assigned_by_id: distributor?.id || admin.id,
        start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        slot_code: 'SLOT004',
        slot_name: '유튜브 채널 성장',
        description: '유튜브 구독자 및 조회수 증가',
        keyword: '요리 레시피',
        url: 'https://youtube.com/@cookingchannel',
        assigned_user_id: normalUsers[0]?.id,
        assigned_by_id: admin.id,
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        slot_code: 'SLOT005',
        slot_name: '인스타그램 마케팅',
        description: '인스타그램 팔로워 증가 및 인게이지먼트 향상',
        keyword: '패션 브랜드',
        url: 'https://instagram.com/fashion_brand',
        assigned_user_id: normalUsers[1]?.id,
        assigned_by_id: agency?.id || admin.id,
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        status: 'pending'
      }
    ];

    // 슬롯 삽입
    for (const slot of slots) {
      const result = await query(
        `INSERT INTO slots (
          slot_code, slot_name, description, keyword, url,
          assigned_user_id, assigned_by_id,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (slot_code) DO UPDATE SET
          slot_name = EXCLUDED.slot_name,
          description = EXCLUDED.description,
          keyword = EXCLUDED.keyword,
          url = EXCLUDED.url,
          status = EXCLUDED.status
        RETURNING id, slot_code, slot_name`,
        [
          slot.slot_code, slot.slot_name, slot.description, slot.keyword, slot.url,
          slot.assigned_user_id, slot.assigned_by_id,
          slot.start_date, slot.end_date, slot.status
        ]
      );
      console.log(`✅ 슬롯 생성: ${result.rows[0].slot_name} (${result.rows[0].slot_code})`);

      // 순위 정보 생성 (active 슬롯만)
      if (slot.status === 'active') {
        const currentRank = Math.floor(Math.random() * 30) + 1;
        const previousRank = currentRank + Math.floor(Math.random() * 10) - 5;
        
        await query(
          `INSERT INTO slot_rankings (slot_id, current_rank, previous_rank, rank_change)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [
            result.rows[0].id,
            currentRank,
            previousRank,
            currentRank < previousRank ? 'up' : currentRank > previousRank ? 'down' : 'same'
          ]
        );
        console.log(`  📊 순위 정보 추가: 현재 ${currentRank}위 (이전 ${previousRank}위)`);
      }
    }

    console.log('\n🎉 모든 테스트 슬롯 생성 완료!');
    console.log(`총 ${slots.length}개의 슬롯이 생성되었습니다.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

seedSlots();