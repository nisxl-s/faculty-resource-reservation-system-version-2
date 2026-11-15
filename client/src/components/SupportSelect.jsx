import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import '../assets/css/bookinghistory.css';
export default function SupportSelect({ id, label, name, value, onChange, options, disabled = false, icon }) {
  const generated = useId();
  const menuId = generated + '-menu';
  const root = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  useEffect(() => {
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => {
    if (open) root.current?.querySelector('[aria-selected="true"]')?.focus();
  }, [open]);
  function pick(option) { if (option.disabled) return; onChange(option.value); setOpen(false); trigger.current?.focus(); }
  function keys(event) {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const items = [...root.current.querySelectorAll('[role="option"]')];
      const index = items.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }
  return <div ref={root} className={'rg-select support-select' + (open ? ' rg-select--open' : '')} onKeyDown={keys} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    {name && <input type="hidden" name={name} value={value} />}
    <button ref={trigger} id={id} type="button" className={'rg-select__trigger' + (icon ? ' support-select__trigger--icon' : '')} disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(!open)}>
      {icon && <span className="support-select__icon" aria-hidden="true">{icon}</span>}<span className="rg-select__label">{selected?.label || 'Choose an option'}</span><span className={'rg-select__chevron' + (open ? ' rg-select__chevron--up' : '')}><ChevronDown size={14}/></span>
    </button>
    {open && <ul id={menuId} role="listbox" aria-label={label} className="rg-select__menu">{options.map(option => <li key={option.value} role="option" tabIndex={-1} aria-selected={value === option.value} aria-disabled={option.disabled || undefined} className={'rg-select__option' + (value === option.value ? ' rg-select__option--active' : '')} onClick={() => pick(option)} onKeyDown={event => { if (['Enter',' '].includes(event.key)) { event.preventDefault(); pick(option); } }}><span className="rg-select__option-dot"/>{option.label}{value === option.value && <span className="rg-select__check"><Check size={14}/></span>}</li>)}</ul>}
  </div>;
}
