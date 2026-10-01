'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { page as s, theme } from '@/lib/ui';

export const fieldFull = {
  ...s.input,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box' as const,
};

export const fieldLabel = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  marginBottom: 6,
};

/** Centered form dialog with blurred backdrop; closes on Esc and locks page scroll. */
export function FormModal({
  title,
  subtitle,
  onClose,
  onSubmit,
  error,
  submitLabel,
  showCancel = true,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitLabel: string;
  showCancel?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 20, 18, 0.42)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        fontFamily: theme.fontBody,
      }}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: theme.creamSoft,
          borderRadius: theme.radiusLg,
          boxShadow: '0 24px 48px rgba(30, 20, 18, 0.22)',
          width: '100%',
          maxWidth: 580,
          maxHeight: 'min(90vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: theme.ink,
          border: `1px solid ${theme.border}`,
        }}
      >
        <header
          style={{
            flexShrink: 0,
            padding: '1.25rem 1.5rem 1rem',
            borderBottom: `1px solid ${theme.border}`,
            background: `linear-gradient(180deg, ${theme.creamSoft} 0%, ${theme.cream} 100%)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <h2
                style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: '1.28rem',
                  fontWeight: 700,
                  color: theme.maroonDeep,
                  margin: 0,
                }}
              >
                {title}
              </h2>
              {subtitle}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.creamSoft,
                borderRadius: '50%',
                width: 34,
                height: 34,
                cursor: 'pointer',
                color: theme.muted,
                fontSize: '1rem',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem 1.5rem 0.5rem', scrollbarWidth: 'thin' }}>
          {error && <div style={{ ...s.error, marginBottom: '0.85rem' }}>{error}</div>}
          {children}
        </div>

        <footer
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '1rem 1.5rem',
            borderTop: `1px solid ${theme.border}`,
            background: theme.creamDeep,
          }}
        >
          <div style={{ display: 'flex', gap: '0.65rem', marginLeft: 'auto' }}>
            {showCancel && (
              <button
                type="button"
                style={{ ...s.btnGhost, minWidth: 108, textAlign: 'center', background: theme.creamSoft }}
                onClick={onClose}
              >
                Cancelar
              </button>
            )}
            <button type="submit" style={{ ...s.btn, minWidth: 132, textAlign: 'center' }}>
              {submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

export function ModalSection({
  step,
  title,
  hint,
  children,
}: {
  step?: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: theme.cream,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: '1rem 1.1rem 1.05rem',
        marginBottom: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: hint ? 6 : '0.75rem' }}>
        {step != null && (
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: theme.maroonDeep,
              color: theme.creamSoft,
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {step}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: theme.maroonDeep }}>{title}</h3>
          {hint ? (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: theme.muted, lineHeight: 1.4 }}>{hint}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function CheckOption({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label
      style={{
        position: 'relative',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.75 : 1,
        padding: '0.6rem 0.75rem',
        borderRadius: theme.radiusSm,
        background: checked ? 'rgba(122, 18, 22, 0.07)' : theme.creamSoft,
        border: `1.5px solid ${checked ? theme.maroon : theme.border}`,
        transition: 'background 140ms ease, border-color 140ms ease',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, margin: 0, pointerEvents: 'none' }}
      />
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: 6,
          display: 'grid',
          placeItems: 'center',
          background: checked ? theme.maroon : '#fff',
          border: `1.5px solid ${checked ? theme.maroon : theme.border}`,
          boxShadow: focused ? '0 0 0 3px rgba(122, 18, 22, 0.25)' : 'none',
          transition: 'background 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: checked ? 1 : 0,
            transform: checked ? 'scale(1)' : 'scale(0.6)',
            transition: 'opacity 140ms ease, transform 160ms cubic-bezier(.2,.8,.3,1.3)',
          }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
        {hint ? <span style={{ display: 'block', fontSize: '0.78rem', color: theme.muted, marginTop: 2 }}>{hint}</span> : null}
      </span>
    </label>
  );
}

/** Pill buttons for picking one option (e.g. role, species). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 999,
              border: `1.5px solid ${active ? theme.maroon : theme.border}`,
              background: active ? theme.maroonDeep : theme.creamSoft,
              color: active ? theme.creamSoft : theme.ink,
              fontWeight: 650,
              fontSize: '0.88rem',
              cursor: 'pointer',
              fontFamily: theme.fontBody,
              transition: 'background 120ms ease, border-color 120ms ease',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Themed dropdown (native <select> popups can't be styled). Menu is fixed-positioned so modal scroll doesn't clip it. */
export function SelectField<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Seleccione…',
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedIdx = options.findIndex((o) => o.value === value);
  const selected = selectedIdx >= 0 ? options[selectedIdx] : null;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const desired = Math.min(280, options.length * 48 + 12);
    const place = () => {
      const r = buttonRef.current!.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 18;
      setPos({ left: r.left, width: r.width, top: r.bottom + 6, maxHeight: Math.max(140, Math.min(desired, below)) });
    };
    place();
    const r0 = buttonRef.current.getBoundingClientRect();
    if (window.innerHeight - r0.bottom - 18 < desired) {
      buttonRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    setActive(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  };

  const pick = (o: { value: T }) => {
    onChange(o.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        style={{
          ...fieldFull,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: theme.fontBody,
          color: selected ? theme.ink : theme.muted,
          borderColor: open ? theme.maroon : theme.border,
          boxShadow: open ? '0 0 0 3px rgba(122, 18, 22, 0.12)' : 'none',
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.maroon}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && pos && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            top: pos.top,
            maxHeight: pos.maxHeight,
            overflowY: 'auto',
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: theme.creamSoft,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            boxShadow: '0 16px 36px rgba(30, 20, 18, 0.18)',
            zIndex: 1100,
            fontFamily: theme.fontBody,
            scrollbarWidth: 'thin',
          }}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            const isActive = i === active;
            return (
              <li
                key={String(o.value)}
                data-idx={i}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '0.55rem 0.7rem',
                  borderRadius: theme.radiusSm,
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: isSel ? 700 : 500,
                  color: isSel ? theme.maroonDeep : theme.ink,
                  background: isActive ? 'rgba(122, 18, 22, 0.08)' : 'transparent',
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block' }}>{o.label}</span>
                  {o.hint ? (
                    <span style={{ display: 'block', fontSize: '0.76rem', color: theme.muted, fontWeight: 500 }}>
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                {isSel && (
                  <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.maroon} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
