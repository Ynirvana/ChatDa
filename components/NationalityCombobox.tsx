'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NATIONALITIES } from '@/lib/nationalities';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.08)',
  border: '1.5px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  color: '#ffffff',
  padding: '14px 18px',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
};

export function NationalityCombobox({
  value,
  onChange,
  placeholder = 'Type to search your nationality',
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
  const listboxId = 'nationality-listbox';

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 외부 클릭으로 닫기
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

  // filter 결과 변경 시 active 인덱스 초기화
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

  // 활성 항목 스크롤
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const isExactMatch = (NATIONALITIES as readonly string[]).includes(query);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `nat-opt-${activeIdx}` : undefined}
        style={{
          ...inputStyle,
          borderColor: isExactMatch ? '#FF6B35' : 'rgba(255,255,255,.12)',
        }}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          // 중간 입력은 아직 선택 아님 — 빈 값으로 확정
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
            background: '#2d1b4e',
            border: '1.5px solid rgba(255,255,255,.15)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          }}
        >
          {filtered.length === 0 && (
            <li style={{ padding: '10px 16px', fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
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
                  color: selected ? '#FF6B35' : '#fff',
                  fontWeight: selected ? 700 : 500,
                  background: active ? 'rgba(255,107,53,.12)' : 'transparent',
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
