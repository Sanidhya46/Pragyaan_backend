// In-memory cache with TTL support (Redis compatible interface)
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key, data, ttlSeconds = 300) {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key) {
    this.store.delete(key);
  }

  async flush() {
    this.store.clear();
  }
}

export const cacheUtil = new MemoryCache();
