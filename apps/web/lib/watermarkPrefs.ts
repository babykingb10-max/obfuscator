"use client";

import { WatermarkSettings } from "./types";

const STORAGE_KEY = "adevos-x-watermark-prefs";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSavedWatermarkPrefs(): WatermarkSettings | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WatermarkSettings;
  } catch {
    return null;
  }
}

export function saveWatermarkPrefs(prefs: WatermarkSettings): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
