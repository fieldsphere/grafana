export type FetchLike = (input: string, init?: RequestInit) => Promise<unknown>;
const STARTUP_REQUEST_TIMEOUT_MS = 10000;

export async function performStartupRequest(
  requestPath: string,
  fetchImpl: FetchLike = window.fetch.bind(window),
  origin: string = window.location.origin
): Promise<boolean> {
  const url = new URL(requestPath, origin);
  if (url.origin !== origin) {
    console.warn(`[Security] Blocked cross-origin startup request: ${url.toString()}`);
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STARTUP_REQUEST_TIMEOUT_MS);

  try {
    await fetchImpl(url.toString(), { method: 'GET', credentials: 'same-origin', signal: controller.signal });
    return true;
  } catch (error) {
    console.warn(`[Startup] Failed startup request: ${url.toString()}`, error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
