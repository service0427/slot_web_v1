import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    // SPA를 위한 라우팅 처리
    return await getAssetFromKV(event, {
      mapRequestToAsset: serveSinglePageApp,
    });
  } catch (e) {
    // 404 에러 시 index.html 반환 (SPA 라우팅)
    if (e.status === 404) {
      try {
        const indexHTML = await getAssetFromKV(event, {
          mapRequestToAsset: (request) => new Request(`${new URL(request.url).origin}/index.html`, request),
        });
        return new Response(indexHTML.body, {
          ...indexHTML,
          headers: {
            ...indexHTML.headers,
            'content-type': 'text/html;charset=UTF-8',
          },
        });
      } catch (e) {
        // index.html도 없는 경우
        return new Response('Not Found', { status: 404 });
      }
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

// SPA를 위한 요청 매핑 함수
function serveSinglePageApp(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 정적 자산은 그대로 처리
  if (pathname.includes('.')) {
    return request;
  }
  
  // 나머지 경로는 index.html로 처리
  return new Request(`${url.origin}/index.html`, request);
}