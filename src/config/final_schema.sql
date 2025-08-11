-- ============================================
-- 슬롯 관리 시스템 최종 DB 스키마
-- PostgreSQL 14+ 
-- 단순화된 구조 (복잡한 FK 제거, ID 기반 조회)
-- ============================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 사용자 테이블 (3단계 권한 시스템)
-- ============================================

-- 사용자 메인 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_slots_keyword ON slots(keyword);
CREATE INDEX idx_slots_created_at ON slots(created_at DESC);

-- ============================================
-- 3. 슬롯 순위 테이블 (단순화)
-- ============================================

-- 현재 순위 정보
CREATE TABLE IF NOT EXISTS slot_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL,
    
    -- 순위 정보
    current_rank INTEGER DEFAULT 0,
    previous_rank INTEGER,
    rank_change VARCHAR(10) CHECK (rank_change IN ('up', 'down', 'same', 'new')),
    
    -- 메타 정보
    search_engine VARCHAR(20) DEFAULT 'naver',
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 순위 변동 이력
CREATE TABLE IF NOT EXISTS slot_ranking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL,
    rank INTEGER NOT NULL,
    keyword VARCHAR(255),
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 순위 인덱스
CREATE INDEX idx_slot_rankings_slot_id ON slot_rankings(slot_id);
CREATE INDEX idx_slot_ranking_history_slot_id ON slot_ranking_history(slot_id);
CREATE INDEX idx_slot_ranking_history_checked_at ON slot_ranking_history(checked_at DESC);

-- ============================================
-- 4. 캐시 시스템 (단순화)
-- ============================================

-- 사용자 잔액
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    paid_balance DECIMAL(12, 2) DEFAULT 0 CHECK (paid_balance >= 0),
    free_balance DECIMAL(12, 2) DEFAULT 0 CHECK (free_balance >= 0),
    total_balance DECIMAL(12, 2) GENERATED ALWAYS AS (paid_balance + free_balance) STORED,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐시 충전 요청
CREATE TABLE IF NOT EXISTS cash_charge_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(50) UNIQUE NOT NULL,         -- 요청 고유 코드
    user_id UUID NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    bonus_amount DECIMAL(12, 2) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    account_holder VARCHAR(100),
    bank_name VARCHAR(50),
    
    processor_id UUID,                                -- 처리한 관리자 ID
    rejection_reason TEXT,
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 캐시 사용 내역
CREATE TABLE IF NOT EXISTS cash_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('charge', 'use', 'refund', 'bonus')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_type VARCHAR(10) CHECK (balance_type IN ('paid', 'free')),
    
    balance_before DECIMAL(12, 2),
    balance_after DECIMAL(12, 2),
    
    description TEXT,
    reference_id UUID,                                -- 관련 ID (충전요청, 슬롯 등)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 캐시 인덱스
CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX idx_cash_charge_requests_user_id ON cash_charge_requests(user_id);
CREATE INDEX idx_cash_charge_requests_status ON cash_charge_requests(status);
CREATE INDEX idx_cash_histories_user_id ON cash_histories(user_id);
CREATE INDEX idx_cash_histories_created_at ON cash_histories(created_at DESC);

-- ============================================
-- 5. 1:1 문의 시스템 (채팅 형식)
-- ============================================

-- 문의 채팅방
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_code VARCHAR(50) UNIQUE NOT NULL,         -- 문의 고유 코드
    
    user_id UUID NOT NULL,                           -- 문의한 사용자
    slot_id UUID,                                     -- 관련 슬롯 (선택)
    
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    assigned_admin_id UUID,                          -- 담당 관리자
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 채팅 메시지
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL,
    
    sender_id UUID NOT NULL,                         -- 발신자 ID
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    
    message TEXT NOT NULL,
    
    -- 읽음 상태
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- 첨부파일 (JSON)
    attachments TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문의 인덱스
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_slot_id ON inquiries(slot_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_assigned_admin_id ON inquiries(assigned_admin_id);
CREATE INDEX idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX idx_inquiry_messages_sender_id ON inquiry_messages(sender_id);

-- ============================================
-- 6. 알림 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    data TEXT,                                        -- JSON 형식의 추가 데이터
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 7. 공지사항 테이블 (최고관리자 전용)
-- ============================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_code VARCHAR(50) UNIQUE NOT NULL,    -- 공지 고유 코드
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'general')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    is_pinned BOOLEAN DEFAULT FALSE,                  -- 상단 고정 여부
    is_visible BOOLEAN DEFAULT TRUE,                  -- 표시 여부
    
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'distributors', 'admins')),
    
    author_id UUID NOT NULL,                          -- 작성자 ID
    view_count INTEGER DEFAULT 0,
    
    expires_at TIMESTAMPTZ,                          -- 만료일 (선택)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지사항 인덱스
CREATE INDEX idx_announcements_is_visible ON announcements(is_visible);
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================
-- 8. 시스템 설정
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. 파일 관리 (단순화)
-- ============================================

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    file_type VARCHAR(50) NOT NULL,                  -- slot, inquiry, user 등
    reference_id UUID NOT NULL,                      -- 관련 ID
    
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 파일 인덱스
CREATE INDEX idx_files_reference_id ON files(reference_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slot_rankings_updated_at BEFORE UPDATE ON slot_rankings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 초기 데이터
-- ============================================

-- 시스템 설정 초기값
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('min_charge_amount', '10000', '최소 충전 금액'),
('max_charge_amount', '10000000', '최대 충전 금액'),
('bonus_rate', '0', '충전 보너스 비율 (%)'),
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
-- 권한 확인 함수
-- ============================================

-- 사용자가 특정 슬롯에 접근 권한이 있는지 확인
CREATE OR REPLACE FUNCTION check_slot_access(p_user_id UUID, p_slot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR(20);
    v_assigned_user_id UUID;
    v_parent_user_id UUID;
BEGIN
    -- 사용자 역할 조회
    SELECT user_role INTO v_user_role FROM users WHERE id = p_user_id;
    
    -- 관리자는 모든 접근 가능
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- 슬롯 할당 사용자 조회
    SELECT assigned_user_id INTO v_assigned_user_id FROM slots WHERE id = p_slot_id;
    
    -- 본인 슬롯인 경우
    IF v_assigned_user_id = p_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- 총판이나 대행사인 경우 하위 사용자 슬롯 접근 가능
    IF v_user_role IN ('distributor', 'agency') THEN
        -- 직속 하위 사용자인지 확인
        SELECT parent_id INTO v_parent_user_id 
        FROM users 
        WHERE id = v_assigned_user_id;
        
        IF v_parent_user_id = p_user_id THEN
            RETURN TRUE;
        END IF;
        
        -- 간접 하위 사용자인지 확인 (계층 경로 사용)
        DECLARE
            v_user_path TEXT;
            v_assigned_path TEXT;
        BEGIN
            SELECT hierarchy_path INTO v_user_path FROM users WHERE id = p_user_id;
            SELECT hierarchy_path INTO v_assigned_path FROM users WHERE id = v_assigned_user_id;
            
            -- 할당된 사용자의 경로에 현재 사용자 ID가 포함되어 있으면 하위 사용자
            IF v_assigned_path LIKE v_user_path || '/%' THEN
                RETURN TRUE;
            END IF;
        END;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 계층 구조 관리 함수 및 트리거
-- ============================================

-- 사용자 계층 경로 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_hierarchy_path()
RETURNS TRIGGER AS $$
BEGIN
    -- parent_id가 NULL이면 최상위 (레벨 1)
    IF NEW.parent_id IS NULL THEN
        NEW.hierarchy_path := '/' || NEW.id::text;
    ELSE
        -- 부모의 경로를 가져와서 자신의 ID 추가
        SELECT hierarchy_path || '/' || NEW.id::text 
        INTO NEW.hierarchy_path
        FROM users 
        WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 생성/수정 시 계층 경로 자동 업데이트 트리거
CREATE TRIGGER trg_update_hierarchy_path
BEFORE INSERT OR UPDATE OF parent_id ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_hierarchy_path();

-- 하위 사용자 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_children_count()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT 시: 부모의 children_count 증가
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE users 
        SET children_count = children_count + 1 
        WHERE id = NEW.parent_id;
        RETURN NEW;
    
    -- DELETE 시: 부모의 children_count 감소
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE users 
        SET children_count = GREATEST(0, children_count - 1)
        WHERE id = OLD.parent_id;
        RETURN OLD;
    
    -- UPDATE 시: 부모가 변경된 경우
    ELSIF TG_OP = 'UPDATE' AND OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
        -- 이전 부모의 count 감소
        IF OLD.parent_id IS NOT NULL THEN
            UPDATE users 
            SET children_count = GREATEST(0, children_count - 1)
            WHERE id = OLD.parent_id;
        END IF;
        
        -- 새 부모의 count 증가
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE users 
            SET children_count = children_count + 1
            WHERE id = NEW.parent_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 하위 사용자 수 자동 업데이트 트리거
-- DELETE 시에는 OLD 값 사용, INSERT/UPDATE 시에는 NEW 값 사용
CREATE TRIGGER trg_update_children_count
AFTER INSERT OR UPDATE OF parent_id OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION update_children_count();

-- 레벨 기반 권한 검증 함수
CREATE OR REPLACE FUNCTION validate_user_level()
RETURNS TRIGGER AS $$
BEGIN
    -- parent_id가 NULL인 경우 level은 1이어야 함 (관리자)
    IF NEW.parent_id IS NULL AND NEW.level != 1 THEN
        RAISE EXCEPTION 'parent_id가 NULL인 경우 level은 1이어야 합니다. (관리자)';
    END IF;
    
    -- parent_id가 있는 경우 부모보다 level이 높아야 함 (숫자가 클수록 하위)
    IF NEW.parent_id IS NOT NULL THEN
        DECLARE
            parent_level INTEGER;
        BEGIN
            SELECT level INTO parent_level FROM users WHERE id = NEW.parent_id;
            
            IF NEW.level <= parent_level THEN
                RAISE EXCEPTION '하위 사용자의 level은 상위 사용자보다 커야 합니다. (부모 레벨: %, 시도한 레벨: %)', parent_level, NEW.level;
            END IF;
            
            -- 레벨 차이는 정확히 1이어야 함 (중간 단계 건너뛰기 방지)
            IF NEW.level - parent_level != 1 THEN
                RAISE EXCEPTION '레벨은 순차적으로 증가해야 합니다. (부모 레벨: %, 예상 레벨: %)', parent_level, parent_level + 1;
            END IF;
            
            -- 레벨 4를 초과할 수 없음
            IF NEW.level > 4 THEN
                RAISE EXCEPTION '레벨은 4를 초과할 수 없습니다. (관리자:1, 총판:2, 대행사:3, 사용자:4)';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 레벨 검증 트리거
CREATE TRIGGER trg_validate_user_level
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION validate_user_level();

-- 계층 구조 내 모든 하위 사용자 조회 함수
CREATE OR REPLACE FUNCTION get_all_descendants(p_user_id UUID)
RETURNS TABLE(user_id UUID, user_code VARCHAR(20), full_name VARCHAR(100), level INTEGER, parent_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
        -- 시작점: 지정된 사용자의 직속 하위 사용자
        SELECT id, user_code, full_name, level, parent_id
        FROM users
        WHERE parent_id = p_user_id
        
        UNION ALL
        
        -- 재귀: 하위의 하위 사용자들
        SELECT u.id, u.user_code, u.full_name, u.level, u.parent_id
        FROM users u
        INNER JOIN descendants d ON u.parent_id = d.id
    )
    SELECT * FROM descendants;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 데이터 조회 함수
-- ============================================

-- 사용자 권한에 따른 슬롯 목록 조회
CREATE OR REPLACE FUNCTION get_user_slots(
    p_user_id UUID,
    p_status VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    slot_id UUID,
    slot_code VARCHAR(50),
    slot_name VARCHAR(255),
    keyword VARCHAR(255),
    url VARCHAR(500),
    thumbnail VARCHAR(500),
    current_rank INTEGER,
    previous_rank INTEGER,
    rank_change VARCHAR(10),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE,
    remaining_days INTEGER,
    progress INTEGER,
    assigned_user_name VARCHAR(100)
) AS $$
DECLARE
    v_user_role VARCHAR(20);
BEGIN
    -- 사용자 역할 조회
    SELECT user_role INTO v_user_role FROM users WHERE id = p_user_id;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.slot_code,
        s.slot_name,
        s.keyword,
        s.url,
        s.thumbnail,
        COALESCE(sr.current_rank, 0),
        sr.previous_rank,
        sr.rank_change,
        s.status,
        s.start_date,
        s.end_date,
        s.remaining_days,
        s.progress,
        u.full_name
    FROM slots s
    LEFT JOIN users u ON s.assigned_user_id = u.id
    LEFT JOIN slot_rankings sr ON s.id = sr.slot_id
    WHERE 
        -- 권한별 필터링
        (v_user_role = 'super_admin' OR                              -- 총관리자: 전체
         (v_user_role = 'distributor' AND u.parent_user_id = p_user_id) OR  -- 총판: 하위 사용자
         (v_user_role = 'user' AND s.assigned_user_id = p_user_id))  -- 사용자: 본인
        AND (p_status IS NULL OR s.status = p_status)
    ORDER BY s.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 성능 최적화를 위한 추가 인덱스
-- ============================================

CREATE INDEX idx_slots_assigned_user_status ON slots(assigned_user_id, status);
CREATE INDEX idx_inquiries_user_status ON inquiries(user_id, status);
CREATE INDEX idx_cash_histories_user_type ON cash_histories(user_id, transaction_type);