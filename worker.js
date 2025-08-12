export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API 요청은 서버로 프록시
    if (url.pathname.startsWith('/api/')) {
      const apiUrl = `${env.API_URL || 'https://api.slot-system.com'}${url.pathname}`;
      return fetch(apiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // 정적 파일 서빙
    return env.ASSETS.fetch(request);
  }
};