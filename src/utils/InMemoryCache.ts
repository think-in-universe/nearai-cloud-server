export class InMemoryCache<V> {
  private readonly cache: Map<string, Cache<V>>;
  private readonly timeToLive: number;
  private readonly cleanInterval: number;

  constructor(timeToLive = 60 * 1000, cleanInterval = 5 * 1000) {
    this.cache = new Map();
    this.timeToLive = timeToLive;
    this.cleanInterval = cleanInterval;
    this.runCleaner();
  }

  private runCleaner() {
    setInterval(() => {
      for (const [key, cache] of this.cache.entries()) {
        if (Date.now() >= cache.expiration) {
          this.cache.delete(key);
        }
      }
    }, this.cleanInterval);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
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
}

type Cache<T> = {
  value: T;
  expiration: number;
};
