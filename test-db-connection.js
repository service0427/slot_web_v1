import pg from 'pg';
const { Client } = pg;

// 연결 정보
const client = new Client({
  host: 'mkt.techb.kr',
  port: 5432,
  database: 'slot_system01',
  user: 'techb',
  password: 'Tech1324!'
});

async function testConnection() {
  try {
    console.log('PostgreSQL 연결 시도 중...');
    await client.connect();
    console.log('✅ 연결 성공!');
    
    // 데이터베이스 정보 확인
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    console.log('\n📊 데이터베이스 정보:');
    console.log('- 데이터베이스:', dbInfo.rows[0].current_database);
    console.log('- 사용자:', dbInfo.rows[0].current_user);
    console.log('- PostgreSQL 버전:', dbInfo.rows[0].version.split(',')[0]);
    
    // UUID 확장 확인
    const extensionCheck = await client.query("SELECT * FROM pg_extension WHERE extname = 'uuid-ossp'");
    if (extensionCheck.rows.length > 0) {
      console.log('\n✅ UUID 확장이 이미 설치되어 있습니다.');
    } else {
      console.log('\n⚠️ UUID 확장이 설치되어 있지 않습니다.');
      console.log('설치 시도 중...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ UUID 확장 설치 완료!');
      } catch (err) {
        console.log('❌ UUID 확장 설치 실패:', err.message);
        console.log('\n💡 대안: PostgreSQL 13+ 버전이므로 gen_random_uuid() 사용 가능');
      }
    }
    
    // 테이블 목록 확인
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 현재 테이블 목록:');
    if (tables.rows.length === 0) {
      console.log('- 테이블이 없습니다. 스키마를 실행해야 합니다.');
    } else {
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
  } catch (err) {
    console.error('❌ 연결 실패:', err.message);
  } finally {
    await client.end();
    console.log('\n연결 종료');
  }
}

testConnection();