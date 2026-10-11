"use client";

import { useEffect } from "react";

// Once the key is on screen, delete the cookie that carried it.
export function ClearNewKey() {
  useEffect(() => {
    void fetch("/api/clear-new-key", { method: "POST" });
  }, []);
  return null;
}
