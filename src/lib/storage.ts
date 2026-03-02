export function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

export function save(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadStr(key: string, fallback = ''): string {
  return localStorage.getItem(key) || fallback;
}

export function saveStr(key: string, val: string) {
  localStorage.setItem(key, val);
}