# PostgreSQL UUID 확장 권한 문제 해결 가이드

## 오류 메시지
```
ERROR: permission denied to create extension "uuid-ossp"
Hint: Must have CREATE privilege on current database to create this extension.
```

## 해결 방법

### 방법 1: 슈퍼유저(postgres)로 접속하여 설치
```bash
# Windows 명령 프롬프트
psql -U postgres -d slot_system

# 또는 pgAdmin에서 postgres 계정으로 접속
```

```sql
-- UUID 확장 설치 (슈퍼유저 권한 필요)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 설치 확인
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
```

### 방법 2: 일반 사용자에게 권한 부여 후 설치
```sql
-- postgres 계정으로 접속 후 실행
GRANT CREATE ON DATABASE slot_system TO slot_user;

-- 이제 slot_user로 접속하여 확장 설치 가능
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 방법 3: UUID 확장 없이 사용 (gen_random_uuid 사용)
PostgreSQL 13+ 버전에서는 기본 제공 함수 사용 가능

```sql
-- uuid-ossp 대신 pgcrypto 사용 (더 가벼움)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 또는 확장 없이 기본 함수 사용 (PostgreSQL 13+)
-- gen_random_uuid() 함수는 기본 제공됨
```

수정된 스키마 파일: `final_schema_no_extension.sql`