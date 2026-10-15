export async function queryArmory(params: Record<string, string>, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once: true});
  const timer = setTimeout(abort, 30000);
  try {
    const response = await fetch('/api/public/shadowcraft/armory', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(params), signal: controller.signal,
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('조회 응답을 읽을 수 없습니다. 페이지를 새로고침한 뒤 다시 검색하세요. 로그인 화면이 나오면 먼저 로그인해 주세요.');
    }
    const data: any = await response.json();
    if (!response.ok) throw new Error(data.error || `조회 실패 (${response.status}). 잠시 후 다시 시도하세요.`);
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('조회 응답이 지연되고 있습니다. 잠시 후 다시 시도하세요.');
    if (error instanceof TypeError) throw new Error('조회 연결이 차단되었거나 끊겼습니다. 새 창에서 페이지를 열어 다시 시도하고, 이 사이트의 차단 확장 프로그램 설정도 확인하세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
