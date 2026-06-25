const KEY = "studentos_user";

export interface MockUser {
  name: string;
  email: string;
}

export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function setMockUser(user: MockUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearMockUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}