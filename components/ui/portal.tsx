'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

/**
 * Renders children into document.body, outside every stacking context and
 * overflow container of the app shell (the sticky header, the scrolling main
 * pane). Renders nothing on the server and during hydration, so server and
 * client markup match.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  return isClient ? createPortal(children, document.body) : null;
}
