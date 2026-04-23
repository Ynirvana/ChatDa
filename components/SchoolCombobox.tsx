'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { KOREAN_UNIVERSITIES } from '@/lib/constants';

/**
 * NationalityCombobox 변형 — Student status의 school 필드용.
 * 차이점: preset에 없는 값도 free text로 저장 가능 (해외대 / 비공식 과정 등 허용).
 */
export function SchoolCombobox({
  value,
  onChange,
  placeholder = 'Search or type your school',
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

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
    if (!q) return KOREAN_UNIVERSITIES as readonly string[];
    return (KOREAN_UNIVERSITIES as readonly string[]).filter(u => u.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const commit = (s: string) => {
    onChange(s);
    setQuery(s);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered[activeIdx]) {
        commit(filtered[activeIdx]);
      } else {
        // preset에 없으면 현재 query 그대로 커밋 (free text)
        commit(query.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const inputHasValue = !!value.trim();

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="input-light"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        style={{
          width: '100%',
          background: '#FFFFFF',
          border: `1.5px solid ${inputHasValue ? '#FF6B5B' : 'rgba(45, 24, 16, .18)'}`,
          borderRadius: 12,
          color: '#2D1810',
          padding: '14px 18px',
          fontSize: 15,
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(45, 24, 16, .06)',
        }}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          // Type-as-you-go commit — free text도 즉시 반영
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKey}
        onBlur={() => { onChange(query.trim()); }}
        autoComplete="off"
      />

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: 240,
            overflowY: 'auto',
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
            background: '#FFFFFF',
            border: '1.5px solid rgba(45, 24, 16, .12)',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(45, 24, 16, .14)',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '10px 16px', fontSize: 13, color: 'rgba(45, 24, 16, .5)' }}>
              No match — press Enter to use &quot;{query.trim()}&quot;
            </li>
          )}
          {filtered.map((s, idx) => {
            const active = idx === activeIdx;
            const selected = s === value;
            return (
              <li
                key={s}
                data-idx={idx}
                role="option"
                aria-selected={selected}
                onMouseDown={e => { e.preventDefault(); commit(s); }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: selected ? '#FF6B5B' : '#2D1810',
                  fontWeight: selected ? 700 : 500,
                  background: active ? 'rgba(255, 107, 91, .1)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {s}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
