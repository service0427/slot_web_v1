# GitHub Secrets 설정 가이드

## 1. CloudFlare API Token 생성

1. CloudFlare Dashboard 접속: https://dash.cloudflare.com/
2. 우측 상단 프로필 → **My Profile** 클릭
3. 좌측 메뉴에서 **API Tokens** 선택
4. **Create Token** 버튼 클릭
5. **Custom token** 선택 후 **Get started** 클릭

### Token 권한 설정:
- **Account** → Cloudflare Workers Scripts: Edit
- **Account** → Cloudflare Pages: Edit  
- **Zone** → Zone: Read
- **Zone** → Workers Routes: Edit

6. **Continue to summary** → **Create Token**
7. 생성된 토큰 복사 (한 번만 표시되므로 반드시 저장!)

## 2. GitHub Repository Secrets 추가

1. GitHub Repository 페이지 접속
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 다음 Secret 추가:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: (위에서 복사한 토큰 붙여넣기)
5. **Add secret** 클릭

## 3. 워크플로우 재실행

1. GitHub **Actions** 탭 이동
2. 실패한 워크플로우 클릭
3. **Re-run all jobs** 클릭

## 추가 정보

- Account ID: `d487a4f4ab6dd57899955ec5775f10ce` (이미 설정됨)
- 토큰은 절대 공개하지 마세요
- 토큰 분실 시 새로 생성해야 합니다