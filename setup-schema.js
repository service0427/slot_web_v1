import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  host: 'mkt.techb.kr',
  port: 5432,
  database: 'slot_system01',
  user: 'techb',
  password: 'Tech1324!'
});

async function setupSchema() {
  try {
    console.log('🚀 스키마 설정 시작...\n');
    await client.connect();
    
    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'src', 'config', 'setup_database.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // SQL 문을 세미콜론으로 분리 (간단한 파싱)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('\\'));
    
    console.log(`📝 ${statements.length}개의 SQL 문 실행 중...\n`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // DO 블록은 특별 처리
      if (statement.includes('DO $$')) {
        continue;
      }
      
      try {
        // CREATE TABLE, INDEX, INSERT 등 실행
        if (statement.includes('CREATE') || statement.includes('INSERT') || statement.includes('SELECT')) {
          await client.query(statement);
          successCount++;
          
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
            if (tableName) console.log(`✅ 테이블 생성: ${tableName}`);
          } else if (statement.includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
            if (indexName) console.log(`📍 인덱스 생성: ${indexName}`);
          } else if (statement.includes('INSERT INTO system_settings')) {
            console.log(`⚙️ 시스템 설정 초기화`);
          } else if (statement.includes('INSERT INTO users')) {
            console.log(`👤 관리자 계정 생성`);
          }
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
          skipCount++;
        } else {
          console.error(`❌ 오류: ${err.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n📊 실행 결과:`);
    console.log(`- 성공: ${successCount}개`);
    console.log(`- 건너뜀: ${skipCount}개`);
    
    // 최종 테이블 확인
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n✅ 생성된 테이블:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 관리자 계정 확인
    const adminCheck = await client.query(`
      SELECT user_code, email, full_name, level, user_role 
      FROM users 
      WHERE user_code = 'ADMIN001'
    `);
    
    if (adminCheck.rows.length > 0) {
      console.log('\n👤 관리자 계정 정보:');
      const admin = adminCheck.rows[0];
      console.log(`  - 계정: ${admin.email}`);
      console.log(`  - 이름: ${admin.full_name}`);
      console.log(`  - 레벨: ${admin.level} (${admin.user_role})`);
      console.log(`  - 초기 비밀번호: admin123`);
    }
    
    console.log('\n🎉 스키마 설정 완료!');
    
  } catch (err) {
    console.error('❌ 스키마 설정 실패:', err.message);
  } finally {
    await client.end();
  }
}

setupSchema();