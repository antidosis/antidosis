import useSWR, { SWRConfiguration } from "swr";

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const defaultConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  keepPreviousData: true,
  errorRetryCount: 2,
};

export function useApi<T = any>(key: string | null, config?: SWRConfiguration) {
  return useSWR<T>(key, { ...defaultConfig, ...config });
}
