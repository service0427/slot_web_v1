-- ============================================
-- 슬롯 관리 시스템 데이터베이스 설정
-- Database: slot_system01
-- PostgreSQL 설정 스크립트
-- ============================================

-- 1단계: postgres 유저로 실행 (슈퍼유저 권한 필요)
-- psql -U postgres 로 접속 후 실행

-- 데이터베이스가 이미 존재한다고 가정 (slot_system01)
\c slot_system01

-- UUID 확장 설치 (슈퍼유저 권한으로)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 확장 설치 확인
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- ============================================
-- 2단계: 테이블 생성 (slot_system01 데이터베이스에서 실행)
-- ============================================

-- 기존 테이블 삭제 (주의: 데이터가 모두 삭제됩니다!)
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS inquiry_messages CASCADE;
-- DROP TABLE IF EXISTS inquiries CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS user_balances CASCADE;
-- DROP TABLE IF EXISTS slot_rankings CASCADE;
-- DROP TABLE IF EXISTS slots CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 4 CHECK (level >= 1 AND level <= 4),
    user_role VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN level = 1 THEN 'admin'
            WHEN level = 2 THEN 'distributor'
            WHEN level = 3 THEN 'agency'
            WHEN level = 4 THEN 'user'
            ELSE 'user'
        END
    ) STORED,
    hierarchy_path TEXT,
    children_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 슬롯 테이블
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_code VARCHAR(50) UNIQUE NOT NULL,
    slot_name VARCHAR(255) NOT NULL,
    description TEXT,
    keyword VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail VARCHAR(500),
    category VARCHAR(20) DEFAULT 'basic' CHECK (category IN ('basic', 'premium', 'vip')),
    work_type VARCHAR(20) DEFAULT 'marketing' CHECK (work_type IN ('translation', 'design', 'development', 'content', 'marketing', 'other')),
    assigned_user_id UUID NOT NULL,
    assigned_by_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    price DECIMAL(12, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    duration_days INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_date IS NOT NULL AND start_date IS NOT NULL THEN 
                (end_date - start_date)
            ELSE 0 
        END
    ) STORED,
    remaining_days INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_date IS NOT NULL THEN 
                GREATEST(0, (end_date - CURRENT_DATE))
            ELSE 0 
        END
    ) STORED,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 슬롯 순위 테이블
CREATE TABLE IF NOT EXISTS slot_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL,
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change VARCHAR(10) DEFAULT 'stable' CHECK (rank_change IN ('up', 'down', 'stable', 'new')),
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 잔액 테이블
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    cash_balance DECIMAL(12, 2) DEFAULT 0,
    point_balance DECIMAL(12, 2) DEFAULT 0,
    total_balance DECIMAL(12, 2) GENERATED ALWAYS AS (cash_balance + point_balance) STORED,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'bonus')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문의 채팅방 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    assigned_admin_id UUID,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    last_message_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문의 메시지 테이블
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'general')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'admin', 'distributor', 'agency', 'user')),
    author_id UUID NOT NULL,
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3단계: 인덱스 생성
-- ============================================

-- Users 인덱스
CREATE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Slots 인덱스
CREATE INDEX IF NOT EXISTS idx_slots_slot_code ON slots(slot_code);
CREATE INDEX IF NOT EXISTS idx_slots_assigned_user_id ON slots(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);

-- Inquiries 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Transactions 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================
-- 4단계: 초기 데이터 삽입
-- ============================================

-- 시스템 설정 초기값
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('maintenance_mode', 'false', '유지보수 모드'),
('max_slots_per_user', '10', '사용자당 최대 슬롯 수'),
('default_slot_duration', '30', '기본 슬롯 기간 (일)')
ON CONFLICT (setting_key) DO NOTHING;

-- 테스트용 관리자 계정 (비밀번호: admin123)
-- 실제 운영시에는 bcrypt로 해시된 비밀번호 사용
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) VALUES
('ADMIN001', 'admin@slot-system.com', '$2a$10$8Dq6LmRfhZKtNFtkGvJ5K.FYp/V7.hJe6tGwxj0S3VqVwK3pxNQNi', '시스템관리자', 1, NULL, '010-0000-0000')
ON CONFLICT (user_code) DO NOTHING;

-- ============================================
-- 5단계: 권한 확인 및 부여
-- ============================================

-- 현재 사용자 확인
SELECT current_user, current_database();

-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- UUID 확장 확인
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- ============================================
-- 실행 완료 메시지
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '데이터베이스 설정이 완료되었습니다!';
    RAISE NOTICE '데이터베이스: slot_system01';
    RAISE NOTICE '관리자 계정: admin@slot-system.com / admin123';
END $$;