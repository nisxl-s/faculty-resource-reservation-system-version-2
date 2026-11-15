import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';
import './ClockTimePicker.css';

const pad = number => String(number).padStart(2, '0');
function displayTime(value) {
  if (!value) return 'Choose a time';
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${pad(minute)} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function ClockTimePicker({ id, name, label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [mode, setMode] = useState('hour');
  const [position, setPosition] = useState({ visibility: 'hidden' });
  const trigger = useRef(null), dialog = useRef(null), hourButton = useRef(null);
  const dragging = useRef(null);

  const close = (restoreFocus = true) => {
    setOpen(false);
    dragging.current = null;
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const anchor = trigger.current.getBoundingClientRect();
      const visual = window.visualViewport;
      const leftEdge = (visual?.offsetLeft || 0) + 10, topEdge = (visual?.offsetTop || 0) + 10;
      const viewWidth = visual?.width || window.innerWidth, viewHeight = visual?.height || window.innerHeight;
      const rightEdge = leftEdge + viewWidth - 20, bottomEdge = topEdge + viewHeight - 20;
      if (anchor.bottom < topEdge || anchor.top > bottomEdge) { setOpen(false); return; }
      const width = Math.min(310, viewWidth - 20), gap = 8;
      const desired = Math.min(dialog.current.scrollHeight, viewHeight - 20);
      const below = Math.max(0, bottomEdge - anchor.bottom - gap), above = Math.max(0, anchor.top - gap - topEdge);
      let left = Math.max(leftEdge, Math.min(anchor.left, rightEdge - width));
      let top, maxHeight = viewHeight - 20;
      if (below >= desired) top = anchor.bottom + gap;
      else if (above >= desired) top = anchor.top - gap - desired;
      else if (rightEdge - anchor.right - gap >= width || anchor.left - leftEdge - gap >= width) {
        left = rightEdge - anchor.right - gap >= width ? anchor.right + gap : anchor.left - gap - width;
        top = Math.max(topEdge, Math.min(anchor.top, bottomEdge - desired));
      } else {
        const up = above > below;
        const available = up ? above : below;
        maxHeight = available >= 280 ? available : viewHeight - 20;
        const height = Math.min(desired, maxHeight);
        top = Math.max(topEdge, Math.min(up ? anchor.top - gap - height : anchor.bottom + gap, bottomEdge - height));
      }
      setPosition({ left, top, width, maxHeight, visibility: 'visible' });
    }
    const update = event => { if (!(event?.target instanceof Node) || !dialog.current?.contains(event.target)) place(); };
    place();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); window.visualViewport?.removeEventListener('resize', update); window.visualViewport?.removeEventListener('scroll', update); };
  }, [open]);

  useLayoutEffect(() => {
    if (open && position.visibility === 'visible') hourButton.current?.focus({ preventScroll: true });
  }, [open, position.visibility]);

  useEffect(() => {
    if (!open) return;
    const outside = event => {
      if (!trigger.current?.contains(event.target) && !dialog.current?.contains(event.target)) { setOpen(false); dragging.current = null; }
    };
    document.addEventListener('pointerdown', outside);

    return () => { document.removeEventListener('pointerdown', outside); };
  }, [open]);

  function show() {
    const [h, m] = (value || '09:00').split(':').map(Number);
    setHour(h % 12 || 12); setMinute(m); setPeriod(h >= 12 ? 'PM' : 'AM');
    setMode('hour'); setPosition({ visibility: 'hidden' }); setOpen(true);
  }

  function dialValue(event, selectionMode) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(x, y) < rect.width * .1) return;
    const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
    if (selectionMode === 'hour') setHour(Math.round(angle / 30) % 12 || 12);
    else setMinute(Math.round(angle / 6) % 60);
  }

  function dialKeys(event) {
    const max = mode === 'hour' ? 12 : 59, min = mode === 'hour' ? 1 : 0;
    const current = mode === 'hour' ? hour : minute;
    const set = mode === 'hour' ? setHour : setMinute;
    let next;
    if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    else if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key)) {
      const delta = ['PageUp', 'PageDown'].includes(event.key) ? (mode === 'minute' ? 5 : 3) : 1;
      const direction = ['ArrowLeft', 'ArrowDown', 'PageDown'].includes(event.key) ? -1 : 1;
      next = ((current - min + direction * delta) % (max - min + 1) + max - min + 1) % (max - min + 1) + min;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (mode === 'hour') setMode('minute');
      return;
    } else return;
    event.preventDefault(); set(next);
  }

  function dialogKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const items = [...dialog.current.querySelectorAll('button:not(:disabled),[tabindex="0"]')];
    const first = items[0], last = items.at(-1);
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      setOpen(false); trigger.current?.focus({ preventScroll: true });
    }
  }

  const angle = mode === 'hour' ? hour % 12 * 30 : minute * 6;
  return <>
    <button ref={trigger} id={id} type="button" className="frr-clock-trigger" aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id + '-clock' : undefined} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }} onClick={() => open ? close() : show()}>
      <Clock size={17} aria-hidden="true" /><span>{displayTime(value)}</span>
    </button>
    {open && createPortal(
      <section ref={dialog} id={id + '-clock'} className="frr-clock-dialog" style={position} role="dialog" aria-label={label + ' clock'} onKeyDown={dialogKeys} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) close(false); }}>
        <header><div><span className="frr-clock-eyebrow">SRI LANKA TIME</span><h2>{label.replace('Availability ', '')}</h2></div><button type="button" className="frr-clock-close" aria-label="Close time picker" onClick={() => close()}><X size={20} /></button></header>
        <div className="frr-clock-digital">
          <button ref={hourButton} type="button" aria-label="Select hour" aria-pressed={mode === 'hour'} onClick={() => setMode('hour')}>{pad(hour)}</button><span>:</span>
          <button type="button" aria-label="Select minute" aria-pressed={mode === 'minute'} onClick={() => setMode('minute')}>{pad(minute)}</button>
          <div className="frr-clock-period" role="group" aria-label="Time period">{['AM', 'PM'].map(p => <button type="button" key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}</div>
        </div>
        <p className="frr-clock-instruction">Drag the hand to choose {mode === 'hour' ? 'an hour' : 'a minute'}.</p>
        <div className="frr-clock-dial" role="slider" tabIndex={0} aria-label={mode === 'hour' ? 'Clock hour' : 'Clock minute'} aria-valuemin={mode === 'hour' ? 1 : 0} aria-valuemax={mode === 'hour' ? 12 : 59} aria-valuenow={mode === 'hour' ? hour : minute} aria-valuetext={mode === 'hour' ? `${hour} ${period}` : `${minute} minutes`} onKeyDown={dialKeys}
          onPointerDown={event => { if (event.pointerType === 'mouse' && event.button !== 0) return; dragging.current = { id: event.pointerId, mode }; event.currentTarget.setPointerCapture(event.pointerId); dialValue(event, mode); }}
          onPointerMove={event => { if (dragging.current?.id === event.pointerId) dialValue(event, dragging.current.mode); }}
          onPointerUp={event => { if (dragging.current?.id !== event.pointerId) return; const selectedMode = dragging.current.mode; dialValue(event, selectedMode); dragging.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); if (selectedMode === 'hour') setMode('minute'); }}
          onPointerCancel={() => { dragging.current = null; }}>
          {Array.from({ length: 60 }, (_, i) => <i key={'tick' + i} className={i % 5 === 0 ? 'frr-clock-tick is-major' : 'frr-clock-tick'} style={{ transform: `rotate(${i * 6}deg)` }} aria-hidden="true" />)}
          <div className="frr-clock-hand" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true"><span /></div><span className="frr-clock-pin" aria-hidden="true" />
          {Array.from({ length: 12 }, (_, i) => { const n = mode === 'hour' ? i || 12 : i * 5; const selected = mode === 'hour' ? hour === n : minute === n; return <span key={i} className={'frr-clock-number' + (selected ? ' is-selected' : '')} style={{ left: `${50 + Math.sin(i * Math.PI / 6) * 38}%`, top: `${50 - Math.cos(i * Math.PI / 6) * 38}%` }} aria-hidden="true">{mode === 'minute' ? pad(n) : n}</span>; })}
        </div>
        <p className="frr-clock-keyboard-hint">Arrow keys adjust one {mode === 'hour' ? 'hour' : 'minute'}. Tap the digits to switch.</p>
        <footer><button type="button" className="frr-clock-clear" onClick={() => { onChange({ target: { name, value: '' } }); close(); }}>Clear</button><button type="button" className="frr-clock-cancel" onClick={() => close()}>Cancel</button><button type="button" className="frr-clock-done" onClick={() => { onChange({ target: { name, value: `${pad(hour % 12 + (period === 'PM' ? 12 : 0))}:${pad(minute)}` } }); close(); }}>Done</button></footer>
      </section>
    , document.body)}
  </>;
}
