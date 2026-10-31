export async function queryArmory(params: Record<string, string>, signal?: AbortSignal): Promise<any> {
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
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
      throw new Error('캐릭터 정보를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 검색해 주세요.');
    }
    const data: any = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || `조회 실패 (${response.status}). 잠시 후 다시 시도하세요.`),{status:response.status});
    return data;
  } catch (error) {
    if(signal?.aborted)throw new DOMException('Aborted','AbortError');
    if (controller.signal.aborted) throw new Error('조회 응답이 지연되고 있습니다. 잠시 후 다시 시도하세요.');
    if (error instanceof TypeError) throw new Error('캐릭터 조회 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 잠시 후 다시 조회해 주세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
