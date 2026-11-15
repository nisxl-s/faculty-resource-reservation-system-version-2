import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScrollReset() {
  const { pathname, hash } = useLocation();
  const previous = useRef(null);

  useLayoutEffect(() => {
    const initial = previous.current === null;
    const changedPage = previous.current?.pathname !== pathname;
    const removedAnchor = Boolean(previous.current?.hash) && !hash;
    previous.current = { pathname, hash };

    if (hash) {
      let id;
      try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      // URL restoration is immediate; click handlers own intentional smooth scrolling.
      target?.scrollIntoView({ behavior: 'instant' });
    } else if (initial || changedPage || removedAnchor) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    // Search-only updates (such as opening Help) must not move the underlying page.
  }, [pathname, hash]);

  return null;
}
