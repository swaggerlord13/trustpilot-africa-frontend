import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for data fetching with loading/error state.
 *
 * @param {Function} fetchFn - Async function that returns the data.
 *   Receives no arguments — close over whatever it needs.
 * @param {Array} deps - Dependency array (re-fetches when these change).
 * @param {Object} options
 * @param {boolean} options.immediate - If false, skip the initial fetch (default true).
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data: categories, loading } = useFetch(
 *     () => api.get("/categories").then(res => res.data),
 *     []
 *   );
 */
export default function useFetch(fetchFn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
      console.error("useFetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, deps);

  return { data, setData, loading, error, refetch };
}
