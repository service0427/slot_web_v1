# 슬롯 관리 시스템

React + TypeScript + Vite로 구축된 슬롯 관리 시스템입니다.

## 주요 기능

### 1. 캐시 시스템 ✅
- **캐시 충전**: 사용자가 캐시 충전 요청을 할 수 있습니다.
- **잔액 표시**: 유료 캐시와 무료 캐시 잔액을 실시간으로 표시합니다.
- **사용 내역**: 캐시 사용 내역을 필터링하여 조회할 수 있습니다.
- **보너스 시스템**: 충전 금액에 따른 무료 캐시 지급 기능

### 2. 1:1 문의 시스템 ✅
- **실시간 채팅**: 사용자와 관리자 간 실시간 메시지 교환
- **문의 상태 관리**: 열림/진행중/해결됨/종료됨 상태 관리
- **읽지 않은 메시지 표시**: 읽지 않은 메시지 개수 실시간 표시
- **슬롯별 문의**: 각 슬롯에 대한 개별 문의 가능
- **첨부파일 지원 준비**: UI는 구현되어 있으며 서버 연동 필요

### 3. 슬롯 관리 시스템 (구현 예정)
- 슬롯 생성 및 관리
- 작업 처리 상태 추적
- 환불 처리

## 시작하기

### 사전 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 프로젝트

### 설치
```bash
# 의존성 설치
npm install
```

### 환경 설정
1. `.env` 파일을 생성합니다:
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

2. Supabase 프로젝트를 생성합니다:
   - https://supabase.com 에서 새 프로젝트 생성
   - 프로젝트 설정 > API에서 URL과 anon key 복사

3. `.env` 파일에 Supabase 설정을 입력합니다:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. 개발 서버를 재시작합니다:
```bash
npm run dev
```

**참고**: 환경 변수 없이도 개발 모드에서는 더미 클라이언트로 실행 가능합니다.

### 데이터베이스 설정
Supabase에서 다음 테이블들을 생성해야 합니다:

#### users 테이블
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_balances 테이블
```sql
CREATE TABLE user_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  paid_balance NUMERIC DEFAULT 0,
  free_balance NUMERIC DEFAULT 0,
  total_balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### cash_charge_requests 테이블
```sql
CREATE TABLE cash_charge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processor_id UUID REFERENCES users(id),
  rejection_reason TEXT,
  free_cash_percentage NUMERIC DEFAULT 0,
  account_holder VARCHAR(100)
);
```

#### user_cash_history 테이블
```sql
CREATE TABLE user_cash_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_id UUID,
  balance_type TEXT
);
```

#### cash_global_settings 테이블 (선택사항)
```sql
CREATE TABLE cash_global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_request_amount NUMERIC DEFAULT 10000,
  free_cash_percentage NUMERIC DEFAULT 0,
  expiry_months INTEGER DEFAULT 0,
  min_usage_amount NUMERIC DEFAULT 0,
  min_usage_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### inquiries 테이블
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES slots(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT,
  priority TEXT DEFAULT 'normal',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### inquiry_messages 테이블
```sql
CREATE TABLE inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  message TEXT,
  attachments JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### inquiry_categories 테이블 (선택사항)
```sql
CREATE TABLE inquiry_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 프로젝트 구조
```
src/
├── components/
│   ├── cash/          # 캐시 관련 컴포넌트
│   │   ├── CashChargeModal.tsx    # 충전 모달
│   │   ├── CashBalanceDisplay.tsx # 잔액 표시
│   │   └── CashHistoryTable.tsx   # 사용 내역
│   ├── inquiry/       # 1:1 문의 컴포넌트
│   │   ├── InquiryChatModal.tsx   # 문의 채팅 모달
│   │   ├── InquiryButton.tsx      # 문의 버튼
│   │   └── InquiryListPage.tsx    # 문의 목록
│   ├── slot/          # 슬롯 관리 컴포넌트
│   └── ui/            # 공통 UI 컴포넌트
├── services/          # API 서비스
│   ├── cashService.ts     # 캐시 관련 API
│   └── inquiryService.ts  # 1:1 문의 API
├── types/             # TypeScript 타입 정의
│   ├── cash.types.ts      # 캐시 관련 타입
│   └── inquiry.types.ts   # 1:1 문의 타입
├── lib/               # 유틸리티 및 설정
│   ├── supabase.ts    # Supabase 클라이언트
│   └── utils.ts       # 유틸리티 함수
└── App.tsx            # 메인 애플리케이션
```

## 기술 스택
- **Frontend**: React, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui 기반 커스텀 컴포넌트
- **Backend**: Supabase
- **State Management**: React Hooks

## 라이선스
이 프로젝트는 비공개 프로젝트입니다.
