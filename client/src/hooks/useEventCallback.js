import { useCallback, useLayoutEffect, useRef } from 'react';
// A stable event/async callback that reads the latest committed state and props.
export function useEventCallback(callback) {
  const current = useRef(callback);
  useLayoutEffect(() => { current.current = callback; });
  return useCallback((...args) => current.current(...args), []);
}
