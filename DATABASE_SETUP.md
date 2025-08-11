# PostgreSQL 데이터베이스 설정 가이드

## 1. PostgreSQL 설치

### Windows
1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치 프로그램 다운로드
2. 설치 시 비밀번호 설정 (기억해두세요!)
3. 기본 포트: 5432

### macOS
```bash
# Homebrew 사용
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 2. 데이터베이스 생성

### PostgreSQL 접속
```bash
# Windows (명령 프롬프트)
psql -U postgres

# macOS/Linux
sudo -u postgres psql
```

### 데이터베이스 및 사용자 생성
```sql
-- 데이터베이스 생성
CREATE DATABASE slot_system;

-- 사용자 생성 (선택사항)
CREATE USER slot_user WITH PASSWORD 'your_secure_password';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE slot_system TO slot_user;

-- UUID 확장 기능 활성화
\c slot_system
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 내용을 입력:

```env
# PostgreSQL 연결 정보
DB_HOST=localhost
DB_PORT=5432
DB_NAME=slot_system
DB_USER=postgres
DB_PASSWORD=your_password_here

# 또는 연결 URL 사용
DATABASE_URL=postgresql://postgres:your_password_here@localhost:5432/slot_system
```

## 4. 스키마 생성

### 방법 1: psql 명령어 사용
```bash
psql -U postgres -d slot_system -f src/config/final_schema.sql
```

### 방법 2: pgAdmin 사용
1. pgAdmin 실행
2. slot_system 데이터베이스 선택
3. Query Tool 열기
4. `src/config/final_schema.sql` 파일 내용 복사/붙여넣기
5. 실행 (F5)

### 방법 3: 프로그램 내에서 자동 실행
```typescript
// src/server/scripts/init-db.ts
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';

const initDB = async () => {
  try {
    const sqlPath = path.join(__dirname, '../../config/final_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ 데이터베이스 스키마 생성 완료');
  } catch (error) {
    console.error('❌ 스키마 생성 실패:', error);
  } finally {
    await pool.end();
  }
};

initDB();
```

실행:
```bash
npx ts-node src/server/scripts/init-db.ts
```

## 5. 연결 테스트

```bash
# Node.js 패키지 설치
npm install pg dotenv
npm install --save-dev @types/pg

# 연결 테스트
npx ts-node -e "
import { testConnection } from './src/server/config/database';
testConnection().then(() => process.exit(0));
"
```

## 6. 초기 데이터 설정

### 계층 구조 시스템 설명
```sql
-- 사용자 레벨 시스템 (4단계 계층)
-- Level 1: 관리자 (admin) - parent_id가 NULL
-- Level 2: 총판 (distributor) - parent_id가 관리자ID
-- Level 3: 대행사 (agency) - parent_id가 총판ID
-- Level 4: 사용자 (user) - parent_id가 대행사ID

-- 계층 구조 예시:
-- 관리자 (Level 1, parent_id: NULL)
--   ├── 총판1 (Level 2, parent_id: 관리자ID)
--   │     ├── 대행사1 (Level 3, parent_id: 총판1ID)
--   │     │     ├── 사용자1 (Level 4, parent_id: 대행사1ID)
--   │     │     └── 사용자2 (Level 4, parent_id: 대행사1ID)
--   │     └── 대행사2 (Level 3, parent_id: 총판1ID)
--   │           ├── 사용자3 (Level 4, parent_id: 대행사2ID)
--   │           └── 사용자4 (Level 4, parent_id: 대행사2ID)
--   └── 총판2 (Level 2, parent_id: 관리자ID)
--         └── 대행사3 (Level 3, parent_id: 총판2ID)
--               └── 사용자5 (Level 4, parent_id: 대행사3ID)

-- 주의사항:
-- 1. 각 레벨은 바로 위 레벨보다 정확히 1 높아야 함
-- 2. 최대 레벨은 4로 제한 (관리자 → 총판 → 대행사 → 사용자)
-- 3. 각 상위 레벨은 자신의 모든 하위 사용자를 관리할 수 있음
```

### 관리자 계정 생성
```sql
-- 비밀번호 해시 생성 (bcrypt 사용)
-- 실제로는 애플리케이션에서 bcrypt로 해시 처리 필요
-- Level 1 (관리자) 생성
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) 
VALUES (
  'ADMIN001', 
  'admin@system.com', 
  '$2a$10$YourHashedPasswordHere', -- 'admin123'을 bcrypt로 해시
  '시스템관리자', 
  1,  -- Level 1: 관리자
  NULL,  -- 최상위이므로 parent_id가 NULL
  '010-0000-0000'
) ON CONFLICT (user_code) DO NOTHING;

-- Level 2 (총판) 예시
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) 
VALUES (
  'DIST001', 
  'distributor1@system.com', 
  '$2a$10$YourHashedPasswordHere',
  '서울총판', 
  2,  -- Level 2: 총판
  (SELECT id FROM users WHERE user_code = 'ADMIN001'),
  '010-1111-1111'
) ON CONFLICT (user_code) DO NOTHING;

-- Level 3 (대행사) 예시
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) 
VALUES (
  'AGENCY001', 
  'agency1@system.com', 
  '$2a$10$YourHashedPasswordHere',
  '강남대행사', 
  3,  -- Level 3: 대행사
  (SELECT id FROM users WHERE user_code = 'DIST001'),
  '010-2222-2222'
) ON CONFLICT (user_code) DO NOTHING;

-- Level 4 (사용자) 예시
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) 
VALUES (
  'USER001', 
  'user1@system.com', 
  '$2a$10$YourHashedPasswordHere',
  '김사용', 
  4,  -- Level 4: 사용자
  (SELECT id FROM users WHERE user_code = 'AGENCY001'),
  '010-3333-3333'
) ON CONFLICT (user_code) DO NOTHING;

-- 권한별 접근 가능 기능:
-- Level 1 (관리자): 시스템 전체 관리, 모든 데이터 접근
-- Level 2 (총판): 자신과 하위 대행사/사용자 관리
-- Level 3 (대행사): 자신과 하위 사용자 관리
-- Level 4 (사용자): 자신의 슬롯만 관리
```

## 7. 백업 및 복원

### 백업
```bash
pg_dump -U postgres -d slot_system > backup_$(date +%Y%m%d).sql
```

### 복원
```bash
psql -U postgres -d slot_system < backup_20241210.sql
```

## 8. 문제 해결

### 연결 오류
- PostgreSQL 서비스가 실행 중인지 확인
- 방화벽에서 5432 포트가 열려있는지 확인
- pg_hba.conf 파일에서 인증 방법 확인

### 권한 오류
```sql
-- 모든 테이블에 대한 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO slot_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO slot_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO slot_user;
```

### 인코딩 문제
```sql
-- 데이터베이스 인코딩 확인
SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = 'slot_system';

-- UTF-8로 데이터베이스 재생성 (필요시)
DROP DATABASE IF EXISTS slot_system;
CREATE DATABASE slot_system WITH ENCODING 'UTF8' LC_COLLATE 'ko_KR.UTF-8' LC_CTYPE 'ko_KR.UTF-8';
```

## 9. 성능 최적화

### 인덱스 확인
```sql
-- 인덱스 목록 조회
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### 쿼리 성능 분석
```sql
-- 느린 쿼리 확인
SELECT query, calls, total_time, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 10. 모니터링

### 현재 연결 확인
```sql
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'slot_system';
```

### 테이블 크기 확인
```sql
SELECT 
  schemaname AS schema,
  tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;