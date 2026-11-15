// src/hooks/useBootstrap.js
import { useEffect, useState } from 'react';

/**
 * tasks = [{ name: string, run: () => Promise<any> }]
 * Runs all tasks in parallel, tracks per-task completion for a real progress %.
 */
export function useBootstrap(tasks) {
  const [done, setDone] = useState(0);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDone(0); setData({}); setError(null); setReady(false);

    Promise.all(
      tasks.map((t) =>
        t.run().then((result) => {
          if (cancelled) return;
          setData((prev) => ({ ...prev, [t.name]: result }));
          setDone((d) => d + 1);
        })
      )
    )
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, [tasks]);

  return {
    isLoading: !ready && !error,
    progress: tasks.length ? (done / tasks.length) * 100 : 100,
    data,
    error,
  };
}
