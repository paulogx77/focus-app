import { useEffect, useState } from 'react';

type UseAppQueryOptions<T> = {
  initialData: T;
  enabled?: boolean;
};

export function useAppQuery<T>(query: () => Promise<T>, deps: unknown[], options: UseAppQueryOptions<T>) {
  const { initialData, enabled = true } = options;
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const result = await query();
        if (mounted) {
          setData(result);
        }
      } catch (error) {
        console.error('Failed to load app query', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, deps);

  return data;
}
