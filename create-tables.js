import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'mkt.techb.kr',
  port: 5432,
  database: 'slot_system01', 
  user: 'techb',
  password: 'Tech1324!'
});

async function createTables() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. Users 테이블 생성
    console.log('1. Users 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('✅ Users 테이블 생성 완료\n');

    // 2. Slots 테이블 생성
    console.log('2. Slots 테이블 생성 중...');
    await client.query(`
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
        duration_days INTEGER,
        remaining_days INTEGER,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Slots 테이블 생성 완료\n');

    // 3. Slot Rankings 테이블
    console.log('3. Slot Rankings 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS slot_rankings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slot_id UUID NOT NULL,
        current_rank INTEGER,
        previous_rank INTEGER,
        rank_change VARCHAR(10) DEFAULT 'stable' CHECK (rank_change IN ('up', 'down', 'stable', 'new')),
        checked_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Slot Rankings 테이블 생성 완료\n');

    // 4. User Balances 테이블
    console.log('4. User Balances 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_balances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID UNIQUE NOT NULL,
        cash_balance DECIMAL(12, 2) DEFAULT 0,
        point_balance DECIMAL(12, 2) DEFAULT 0,
        total_balance DECIMAL(12, 2) GENERATED ALWAYS AS (cash_balance + point_balance) STORED,
        last_updated TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ User Balances 테이블 생성 완료\n');

    // 5. Transactions 테이블
    console.log('5. Transactions 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('✅ Transactions 테이블 생성 완료\n');

    // 6. Inquiries 테이블
    console.log('6. Inquiries 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('✅ Inquiries 테이블 생성 완료\n');

    // 7. Inquiry Messages 테이블
    console.log('7. Inquiry Messages 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiry_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        inquiry_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ Inquiry Messages 테이블 생성 완료\n');

    // 8. Announcements 테이블
    console.log('8. Announcements 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('✅ Announcements 테이블 생성 완료\n');

    // 9. Activity Logs 테이블
    console.log('9. Activity Logs 테이블 생성 중...');
    await client.query(`
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
      )
    `);
    console.log('✅ Activity Logs 테이블 생성 완료\n');

    // 10. System Settings 테이블
    console.log('10. System Settings 테이블 생성 중...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ System Settings 테이블 생성 완료\n');

    // 시스템 설정 초기값 삽입
    console.log('시스템 설정 초기화 중...');
    await client.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('maintenance_mode', 'false', '유지보수 모드'),
      ('max_slots_per_user', '10', '사용자당 최대 슬롯 수'),
      ('default_slot_duration', '30', '기본 슬롯 기간 (일)')
      ON CONFLICT (setting_key) DO NOTHING
    `);
    console.log('✅ 시스템 설정 초기화 완료\n');

    // 관리자 계정 생성
    console.log('관리자 계정 생성 중...');
    await client.query(`
      INSERT INTO users (user_code, email, password_hash, full_name, level, parent_id, phone) VALUES
      ('ADMIN001', 'admin@slot-system.com', '$2a$10$8Dq6LmRfhZKtNFtkGvJ5K.FYp/V7.hJe6tGwxj0S3VqVwK3pxNQNi', '시스템관리자', 1, NULL, '010-0000-0000')
      ON CONFLICT (user_code) DO NOTHING
    `);
    console.log('✅ 관리자 계정 생성 완료\n');
    console.log('📧 관리자 로그인: admin@slot-system.com / admin123\n');

    // 최종 확인
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('🎉 모든 테이블 생성 완료!');
    console.log('\n📋 생성된 테이블 목록:');
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (err) {
    console.error('❌ 오류 발생:', err);
  } finally {
    await client.end();
    console.log('\n데이터베이스 연결 종료');
  }
}

createTables();