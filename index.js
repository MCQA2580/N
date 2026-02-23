// Cloudflare Worker 脚本

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 读取并返回index.html文件
  try {
    const response = await fetch('https://n-4gh5.pages.dev/index.html');
    return new Response(response.body, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    return new Response('Error loading page', {
      status: 500,
    });
  }
}
