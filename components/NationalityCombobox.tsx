'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NATIONALITIES } from '@/lib/nationalities';

export function NationalityCombobox({
  value,
  onChange,
  placeholder = 'Type to search your nationality',
  light = true,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  light?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = 'nationality-listbox';

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NATIONALITIES as readonly string[];
    return (NATIONALITIES as readonly string[]).filter(n => n.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const commit = (n: string) => {
    onChange(n);
    setQuery(n);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIdx]) {
        e.preventDefault();
        commit(filtered[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const isExactMatch = (NATIONALITIES as readonly string[]).includes(query);

  // Theme-aware 색상
  const inputBg = light ? '#FFFFFF' : 'rgba(255,255,255,.08)';
  const inputBorder = light ? 'rgba(45, 24, 16, .18)' : 'rgba(255,255,255,.12)';
  const inputBorderFocus = light ? '#FF6B5B' : '#FF6B35';
  const inputText = light ? '#2D1810' : '#ffffff';
  const inputShadow = light ? '0 2px 8px rgba(45, 24, 16, .06)' : 'none';

  const popupBg = light ? '#FFFFFF' : '#2d1b4e';
  const popupBorder = light ? 'rgba(45, 24, 16, .12)' : 'rgba(255,255,255,.15)';
  const popupShadow = light ? '0 12px 40px rgba(45, 24, 16, .14)' : '0 8px 32px rgba(0,0,0,.4)';
  const itemText = light ? '#2D1810' : '#fff';
  const itemSelectedColor = light ? '#FF6B5B' : '#FF6B35';
  const itemActiveBg = light ? 'rgba(255, 107, 91, .1)' : 'rgba(255,107,53,.12)';
  const emptyText = light ? 'rgba(45, 24, 16, .5)' : 'rgba(255,255,255,.4)';

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className={light ? 'input-light' : undefined}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `nat-opt-${activeIdx}` : undefined}
        style={{
          width: '100%',
          background: inputBg,
          border: `1.5px solid ${isExactMatch ? inputBorderFocus : inputBorder}`,
          borderRadius: 12,
          color: inputText,
          padding: '14px 18px',
          fontSize: 15,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: inputShadow,
        }}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value === '') onChange('');
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 260,
            overflowY: 'auto',
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
            background: popupBg,
            border: `1.5px solid ${popupBorder}`,
            borderRadius: 12,
            boxShadow: popupShadow,
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '10px 16px', fontSize: 13, color: emptyText }}>
              No match. Pick &quot;Other&quot;.
            </li>
          )}
          {filtered.map((n, idx) => {
            const active = idx === activeIdx;
            const selected = n === value;
            return (
              <li
                key={n}
                id={`nat-opt-${idx}`}
                data-idx={idx}
                role="option"
                aria-selected={selected}
                onMouseDown={e => {
                  e.preventDefault();
                  commit(n);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: selected ? itemSelectedColor : itemText,
                  fontWeight: selected ? 700 : 500,
                  background: active ? itemActiveBg : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {n}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
