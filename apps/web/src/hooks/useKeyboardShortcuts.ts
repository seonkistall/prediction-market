'use client';

import { useEffect, useCallback, useState } from 'react';

interface ShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcut(options: ShortcutOptions) {
  const { key, ctrl, meta, shift, alt, callback, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (ctrl || meta ? ctrlOrMeta : !ctrlOrMeta) &&
        (shift ? event.shiftKey : !event.shiftKey) &&
        (alt ? event.altKey : !event.altKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, ctrl, meta, shift, alt, callback, enabled]);
}

interface KeySequence {
  keys: string[];
  callback: () => void;
  enabled?: boolean;
}

export function useKeySequence(options: KeySequence) {
  const { keys, callback, enabled = true } = options;
  const [sequence, setSequence] = useState<string[]>([]);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTime;

      // Reset sequence if too much time has passed (500ms)
      if (timeDiff > 500) {
        setSequence([event.key.toLowerCase()]);
      } else {
        setSequence((prev) => [...prev, event.key.toLowerCase()]);
      }

      setLastKeyTime(now);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lastKeyTime, enabled]);

  useEffect(() => {
    if (
      sequence.length === keys.length &&
      sequence.every((k, i) => k === keys[i].toLowerCase())
    ) {
      callback();
      setSequence([]);
    }
  }, [sequence, keys, callback]);
}

// Convenient hook for list navigation
export function useListNavigation(
  listLength: number,
  onSelect?: (index: number) => void,
  enabled = true
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : listLength - 1));
  }, [listLength]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : 0));
  }, [listLength]);

  const select = useCallback(() => {
    onSelect?.(selectedIndex);
  }, [selectedIndex, onSelect]);

  useKeyboardShortcut({ key: 'j', callback: moveDown, enabled });
  useKeyboardShortcut({ key: 'k', callback: moveUp, enabled });
  useKeyboardShortcut({ key: 'ArrowDown', callback: moveDown, enabled });
  useKeyboardShortcut({ key: 'ArrowUp', callback: moveUp, enabled });
  useKeyboardShortcut({ key: 'Enter', callback: select, enabled });

  return { selectedIndex, setSelectedIndex };
}

// Hook for Command Palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useKeyboardShortcut({ key: 'k', meta: true, callback: toggle });
  useKeyboardShortcut({ key: 'Escape', callback: close, enabled: isOpen });

  return { isOpen, open, close, toggle };
}
