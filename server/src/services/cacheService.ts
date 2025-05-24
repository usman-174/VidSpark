const cache = new Map<string, { value: any; expires: number }>();

export const fetchCached = async <T>(key: string, fetcher: () => Promise<T>, ttl = 60 * 5): Promise<T> => {
  const entry = cache.get(key);
  const now = Date.now();

  if (entry && entry.expires > now) return entry.value;

  const value = await fetcher();
  cache.set(key, { value, expires: now + ttl * 1000 });
  return value;
};  