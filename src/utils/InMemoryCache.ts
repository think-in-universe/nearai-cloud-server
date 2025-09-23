export class InMemoryCache<V> {
  static ENABLE_CACHE_CLEANER = true;

  private readonly cache: Map<string, Cache<V>>;
  private readonly timeToLive: number;
  private readonly cleanInterval: number;

  constructor(timeToLive = 60 * 1000, cleanInterval = 5 * 1000) {
    this.cache = new Map();
    this.timeToLive = timeToLive;
    this.cleanInterval = cleanInterval;

    if (InMemoryCache.ENABLE_CACHE_CLEANER) {
      this.runCleaner();
    }
  }

  private runCleaner(): NodeJS.Timeout {
    return setInterval(() => this.clean(), this.cleanInterval);
  }

  private clean() {
    for (const [key, cache] of this.cache.entries()) {
      if (isExpired(cache)) {
        this.cache.delete(key);
      }
    }
  }

  keys(): string[] {
    const keys: string[] = [];
    this.cache.entries().forEach(([key, cache]) => {
      if (!isExpired(cache)) {
        keys.push(key);
      }
    });
    return keys;
  }

  get(key: string): V | undefined {
    const cache = this.cache.get(key);

    if (!cache) {
      return undefined;
    }

    if (Date.now() > cache.expiration) {
      return undefined;
    }

    return cache.value;
  }

  getTyped<V>(key: string): V | undefined {
    return this.get(key) as unknown as V;
  }

  set(key: string, value: V, timeToLive?: number) {
    this.cache.set(key, {
      value,
      expiration: Date.now() + (timeToLive ?? this.timeToLive),
    });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

type Cache<T> = {
  value: T;
  expiration: number;
};

function isExpired<V>(cache: Cache<V>): boolean {
  return Date.now() >= cache.expiration;
}
