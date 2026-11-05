import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Subscribe to the OS viewport as an external store. The media query is the
// "subscription": React reads the current match on every render that needs
// it and re-renders on change, replacing the old mount-effect + setState
// pattern. The server snapshot uses the desktop default, mirroring the
// old `undefined` initial value.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  const isMobile = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false
  )

  return isMobile
}
