"use client";

import { ObfuscationSettings } from "./types";

export interface VaultEntry {
  id: string;
  label: string;
  createdAt: string;
  sourceCode: string;
  settings: ObfuscationSettings;
}

const STORAGE_KEY = "adevos-x-vault";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getVaultEntries(): VaultEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVaultEntry(
  sourceCode: string,
  settings: ObfuscationSettings,
  label?: string
): VaultEntry {
  const entries = getVaultEntries();
  const entry: VaultEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label?.trim() || `Snippet ${entries.length + 1}`,
    createdAt: new Date().toISOString(),
    sourceCode,
    settings,
  };
  const next = [entry, ...entries].slice(0, 50); // keep the vault bounded
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function deleteVaultEntry(id: string): VaultEntry[] {
  const next = getVaultEntries().filter((e) => e.id !== id);
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearVault(): void {
  if (isBrowser()) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
