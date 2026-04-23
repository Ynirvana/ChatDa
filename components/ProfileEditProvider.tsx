'use client';

import {
  createContext, useCallback, useContext, useEffect,
  useMemo, useState, type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  isDirty: boolean;
  save: () => Promise<void>;
}

interface Ctx {
  register: (id: string, reg: Registration) => void;
  unregister: (id: string) => void;
}

const ProfileEditCtx = createContext<Ctx | null>(null);

export function useProfileEdit(id: string, isDirty: boolean, save: () => Promise<void>) {
  const ctx = useContext(ProfileEditCtx);
  useEffect(() => {
    if (!ctx) return;
    ctx.register(id, { isDirty, save });
    return () => ctx.unregister(id);
  }, [ctx, id, isDirty, save]);
}

export function ProfileEditProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [regs, setRegs] = useState<Record<string, Registration>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback((id: string, reg: Registration) => {
    setRegs(prev => {
      const existing = prev[id];
      if (existing && existing.isDirty === reg.isDirty && existing.save === reg.save) return prev;
      return { ...prev, [id]: reg };
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setRegs(prev => {
      if (!(id in prev)) return prev;
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const ctxValue = useMemo(() => ({ register, unregister }), [register, unregister]);

  const dirtyRegs = Object.values(regs).filter(r => r.isDirty);
  const dirtyCount = dirtyRegs.length;
  const anyDirty = dirtyCount > 0;

  const saveAll = async () => {
    if (saving || !anyDirty) return;
    setSaving(true);
    setError(null);
    try {
      for (const reg of dirtyRegs) {
        await reg.save();
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Some changes failed to save. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileEditCtx.Provider value={ctxValue}>
      {children}
      <SaveBar count={dirtyCount} saving={saving} error={error} onSave={saveAll} />
    </ProfileEditCtx.Provider>
  );
}

function SaveBar({
  count, saving, error, onSave,
}: {
  count: number;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}) {
  const disabled = count === 0 || saving;
  return (
    <div style={{
      marginTop: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>
      {error && (
        <p style={{ fontSize: 12, color: '#E84F3D', fontWeight: 700, textAlign: 'center' }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        style={{
          padding: '14px 44px',
          borderRadius: 999,
          border: 'none',
          fontSize: 15,
          fontWeight: 800,
          cursor: saving ? 'wait' : disabled ? 'not-allowed' : 'pointer',
          background: disabled ? 'rgba(45, 24, 16, .08)' : 'linear-gradient(135deg, #FF6B5B, #E84393)',
          color: disabled ? 'rgba(45, 24, 16, .35)' : '#fff',
          fontFamily: 'inherit',
          boxShadow: disabled ? 'none' : '0 6px 18px rgba(255, 107, 91, .28)',
          minWidth: 260,
          transition: 'all .15s',
        }}
      >
        {saving
          ? 'Saving...'
          : count === 0
            ? 'No changes to save'
            : `Save ${count} change${count > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
