let nextId = 0;

export function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${++nextId}`;
}
