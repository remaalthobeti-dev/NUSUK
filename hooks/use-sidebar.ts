"use client";

import { useState, useCallback } from "react";

export function useSidebar(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggle = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const toggleMobile = useCallback(
    () => setIsMobileOpen((prev) => !prev),
    []
  );
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return { isCollapsed, toggle, isMobileOpen, toggleMobile, closeMobile };
}
