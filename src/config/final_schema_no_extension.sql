-- ============================================
-- 슬롯 관리 시스템 최종 DB 스키마
-- PostgreSQL 13+ (UUID 확장 없이 사용)
-- 단순화된 구조 (복잡한 FK 제거, ID 기반 조회)
-- ============================================

-- UUID 확장 대신 기본 함수 사용 (PostgreSQL 13+)
-- gen_random_uuid() 함수는 PostgreSQL 13부터 기본 제공

-- ============================================
-- 1. 사용자 테이블 (4단계 권한 시스템)
-- ============================================

-- 사용자 메인 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code VARCHAR(20) UNIQUE NOT NULL,            -- 사용자 고유 코드 (로그인 ID)
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- 계층 구조 및 권한 시스템
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 상위 사용자 ID (NULL이면 최상위)
    level INTEGER DEFAULT 4 CHECK (level >= 1 AND level <= 4), -- 1: 관리자, 2: 총판, 3: 대행사, 4: 사용자
    user_role VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN level = 1 THEN 'admin'        -- 관리자
            WHEN level = 2 THEN 'distributor'  -- 총판
            WHEN level = 3 THEN 'agency'       -- 대행사
            WHEN level = 4 THEN 'user'         -- 사용자
            ELSE 'user'
        END
    ) STORED,
    
    -- 계층 경로 (예: /root_id/parent_id/my_id)
    hierarchy_path TEXT,
    
    -- 하위 사용자 수 (총판의 경우 관리하는 사용자 수)
    children_count INTEGER DEFAULT 0,
    
    -- 계정 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- 타임스탬프
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 인덱스
CREATE INDEX idx_users_user_code ON users(user_code);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_parent_id ON users(parent_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_hierarchy_path ON users(hierarchy_path);

-- ============================================
-- 2. 슬롯 테이블 (관리자가 할당)
-- ============================================

CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code VARCHAR(50) UNIQUE NOT NULL,            -- 슬롯 고유 코드
    
    -- 기본 정보
    slot_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- SEO/마케팅 필드
    keyword VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail VARCHAR(500),
    
    -- 분류
    category VARCHAR(20) DEFAULT 'basic' CHECK (category IN ('basic', 'premium', 'vip')),
    work_type VARCHAR(20) DEFAULT 'marketing' CHECK (work_type IN ('translation', 'design', 'development', 'content', 'marketing', 'other')),
    
    -- 할당 정보 (관리자가 사용자에게 할당)
    assigned_user_id UUID NOT NULL,                   -- 할당받은 사용자 ID
    assigned_by_id UUID NOT NULL,                     -- 할당한 관리자 ID
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    
    -- 가격 및 일정
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
    
    -- 진행률
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 슬롯 인덱스
CREATE INDEX idx_slots_slot_code ON slots(slot_code);
CREATE INDEX idx_slots_assigned_user_id ON slots(assigned_user_id);
CREATE INDEX idx_slots_assigned_by_id ON slots(assigned_by_id);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_slots_category ON slots(category);
CREATE INDEX idx_slots_work_type ON slots(work_type);
CREATE INDEX idx_slots_start_date ON slots(start_date);
CREATE INDEX idx_slots_end_date ON slots(end_date);

-- ============================================
-- 3. 슬롯 순위 추적 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS slot_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL,
    
    -- 순위 정보
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change VARCHAR(10) DEFAULT 'stable' CHECK (rank_change IN ('up', 'down', 'stable', 'new')),
    
    -- 추적 정보
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 순위 인덱스
CREATE INDEX idx_slot_rankings_slot_id ON slot_rankings(slot_id);
CREATE INDEX idx_slot_rankings_checked_at ON slot_rankings(checked_at);

-- ============================================
-- 4. 캐시 관리 테이블
-- ============================================

-- 사용자 잔액 테이블
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    
    -- 잔액 정보
    cash_balance DECIMAL(12, 2) DEFAULT 0,
    point_balance DECIMAL(12, 2) DEFAULT 0,
    total_balance DECIMAL(12, 2) GENERATED ALWAYS AS (cash_balance + point_balance) STORED,
    
    -- 타임스탬프
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 잔액 인덱스
CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- 거래 정보
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'bonus')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    
    -- 상세 정보
    description TEXT,
    reference_id UUID,                              -- 관련 슬롯 ID 등
    payment_method VARCHAR(50),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- 타임스탬프
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래 인덱스
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- 5. 문의 관리 테이블 (채팅 형식)
-- ============================================

-- 문의 채팅방 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- 참여자
    user_id UUID NOT NULL,
    assigned_admin_id UUID,
    
    -- 문의 정보
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    -- 타임스탬프
    last_message_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문의 인덱스
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_assigned_admin_id ON inquiries(assigned_admin_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_priority ON inquiries(priority);

-- 문의 메시지 테이블
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 메시지 정보
    inquiry_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    
    -- 내용
    message TEXT NOT NULL,
    
    -- 읽음 상태
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지 인덱스
CREATE INDEX idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX idx_inquiry_messages_sender_id ON inquiry_messages(sender_id);
CREATE INDEX idx_inquiry_messages_created_at ON inquiry_messages(created_at);

-- ============================================
-- 6. 공지사항 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- 공지 내용
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- 분류
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'general')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- 표시 옵션
    is_pinned BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'admin', 'distributor', 'agency', 'user')),
    
    -- 작성자
    author_id UUID NOT NULL,
    
    -- 통계
    view_count INTEGER DEFAULT 0,
    
    -- 유효기간
    expires_at TIMESTAMPTZ,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지사항 인덱스
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX idx_announcements_is_visible ON announcements(is_visible);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);

-- ============================================
-- 7. 활동 로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 활동 정보
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- 상세 정보
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 활동 로그 인덱스
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- 8. 시스템 설정 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    
    -- 타임스탬프
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 설정 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('maintenance_mode', 'false', '유지보수 모드'),
('max_slots_per_user', '10', '사용자당 최대 슬롯 수'),
('default_slot_duration', '30', '기본 슬롯 기간 (일)'),
('slot_commission_rate', '5', '슬롯 수수료율 (%)'),
('max_file_size', '10485760', '최대 파일 크기 (10MB)')
ON CONFLICT (setting_key) DO NOTHING;

-- 초기 관리자 계정 (비밀번호: admin123 - 실제로는 해시 처리)
-- level=1이면 자동으로 user_role='admin'이 됨
INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) VALUES
('ADMIN001', 'admin@system.com', '$2a$10$YourHashedPasswordHere', '최고관리자', 1, NULL, '010-0000-0000')
ON CONFLICT (user_code) DO NOTHING;

-- ============================================
-- 뷰(View) - 권한별 데이터 조회
-- ============================================

-- 사용자별 슬롯 조회 뷰
CREATE OR REPLACE VIEW v_user_slots AS
SELECT 
    s.*,
    u.full_name as assigned_user_name,
    u.user_code as assigned_user_code,
    sr.current_rank,
    sr.previous_rank,
    sr.rank_change
FROM slots s
LEFT JOIN users u ON s.assigned_user_id = u.id
LEFT JOIN slot_rankings sr ON s.id = sr.slot_id
WHERE s.status != 'cancelled';

-- 총판별 하위 사용자 조회 뷰
CREATE OR REPLACE VIEW v_distributor_users AS
SELECT 
    d.id as distributor_id,
    d.full_name as distributor_name,
    u.*
FROM users d
JOIN users u ON u.parent_id = d.id
WHERE d.level = 2;  -- level 2는 총판

-- 사용자 통계 뷰
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT 
    u.id,
    u.user_code,
    u.full_name,
    u.user_role,
    u.level,
    u.parent_id,
    u.children_count,
    COUNT(DISTINCT s.id) as total_slots,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_slots,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_slots,
    COALESCE(ub.total_balance, 0) as current_balance,
    COUNT(DISTINCT i.id) as total_inquiries
FROM users u
LEFT JOIN slots s ON u.id = s.assigned_user_id
LEFT JOIN user_balances ub ON u.id = ub.user_id
LEFT JOIN inquiries i ON u.id = i.user_id
GROUP BY u.id, u.user_code, u.full_name, u.user_role, u.level, u.parent_id, u.children_count, ub.total_balance;

-- ============================================
-- 트리거 및 함수는 별도 파일로 관리
-- (final_schema_triggers.sql)
-- ============================================