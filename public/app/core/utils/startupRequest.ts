export type FetchLike = (input: string, init?: RequestInit) => Promise<unknown>;

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

  try {
    await fetchImpl(url.toString(), { method: 'GET', credentials: 'same-origin' });
  } catch (error) {
    console.warn(`[Startup] Failed startup request: ${url.toString()}`, error);
  }

  return true;
}
