'use client';

import { useEffect, useRef, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  /** 좌측 프리픽스 (이모지/아이콘 레이블용) */
  prefix?: React.ReactNode;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  options: FilterOption[];
  /** value가 빈 문자열일 때 표시할 placeholder ("Any location" 등) */
  placeholder: string;
  /** 팝업 최소 너비. 버튼보다 넓게 뽑고 싶을 때 */
  minWidth?: number;
  /** 라이트 테마 — 크림 페이지 위용. Defaults to true (앞으로 라이트가 기본). */
  light?: boolean;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  minWidth,
  light = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find(o => o.value === value);
  const hasValue = !!value;

  useEffect(() => {
    if (open) {
      const idx = options.findIndex(o => o.value === value);
      setActiveIdx(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

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

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  const commit = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, options.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const opt = options[activeIdx];
        if (opt) commit(opt.value);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
  };

  // Theme-aware 색상
  const btnBg = light
    ? (hasValue ? 'linear-gradient(135deg, rgba(255,107,91,.14), rgba(232,67,147,.12))' : '#FFFFFF')
    : (hasValue ? 'linear-gradient(135deg, rgba(255,107,53,.18), rgba(232,67,147,.18))' : 'rgba(255,255,255,.06)');
  const btnBorder = light
    ? (hasValue ? 'rgba(255,107,91,.5)' : 'rgba(45, 24, 16, .18)')
    : (hasValue ? 'rgba(255,107,53,.4)' : 'rgba(255,255,255,.1)');
  const btnText = light
    ? (hasValue ? '#2D1810' : '#3D2416')
    : (hasValue ? '#fff' : 'rgba(255,255,255,.65)');
  const btnCaret = light ? 'rgba(45, 24, 16, .5)' : 'rgba(255,255,255,.5)';
  const btnShadow = light ? '0 2px 8px rgba(45, 24, 16, .06)' : 'none';

  const popupBg = light ? '#FFFFFF' : '#2d1b4e';
  const popupBorder = light ? 'rgba(45, 24, 16, .12)' : 'rgba(255,255,255,.15)';
  const popupShadow = light ? '0 12px 40px rgba(45, 24, 16, .14)' : '0 12px 40px rgba(0,0,0,.5)';
  const itemText = light ? '#2D1810' : '#fff';
  const itemSelectedColor = light ? '#FF6B5B' : '#FF6B35';
  const itemActiveBg = light ? 'rgba(255, 107, 91, .1)' : 'rgba(255,107,53,.12)';

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKey}
        style={{
          width: '100%',
          padding: '11px 18px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          background: btnBg,
          border: `1.5px solid ${btnBorder}`,
          color: btnText,
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          textAlign: 'left',
          transition: 'all .15s',
          boxShadow: btnShadow,
        }}
      >
        <span style={{
          flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          {selected?.prefix}
          <span>{selected?.label ?? placeholder}</span>
        </span>
        <span style={{
          fontSize: 10, color: btnCaret,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .15s',
        }}>▼</span>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: minWidth ?? 'unset',
            zIndex: 50,
            maxHeight: 280,
            overflowY: 'auto',
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
            background: popupBg,
            border: `1.5px solid ${popupBorder}`,
            borderRadius: 14,
            boxShadow: popupShadow,
          }}
        >
          {options.map((opt, idx) => {
            const active = idx === activeIdx;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value || `_empty_${idx}`}
                data-idx={idx}
                role="option"
                aria-selected={isSelected}
                onMouseDown={e => {
                  e.preventDefault();
                  commit(opt.value);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? itemSelectedColor : itemText,
                  background: active ? itemActiveBg : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {opt.prefix}
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isSelected && (
                  <span style={{ fontSize: 12, color: itemSelectedColor }}>✓</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
