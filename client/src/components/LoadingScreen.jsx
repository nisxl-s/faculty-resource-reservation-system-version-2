import {useEffect,useState} from 'react';
import './LoadingScreen.css';
const MESSAGES=['Checking hall availability','Syncing lab schedules','Loading equipment inventory','Preparing your dashboard'];
const SLOTS=12,BOOKED=6;
// No artificial minimum duration: quick loads never show; completed work never waits.
export default function LoadingScreen({isLoading=false,progress,delay=500}) {
  const [visible,setVisible]=useState(false);
  const [msgIndex,setMsgIndex]=useState(0);
  useEffect(()=>{
    if(!isLoading){setVisible(false);return;}
    const timer=setTimeout(()=>{setMsgIndex(0);setVisible(true);},delay);
    return ()=>clearTimeout(timer);
  },[isLoading,delay]);
  useEffect(()=>{if(!visible)return;const timer=setInterval(()=>setMsgIndex(value=>(value+1)%MESSAGES.length),1600);return()=>clearInterval(timer);},[visible]);
  if(!visible || !isLoading)return null;
  const knownProgress=Number.isFinite(progress);
  const shown=knownProgress?Math.max(0,Math.min(100,progress)):0;
  return (
    <div
      className="ls-root"
      role="status"
      aria-live="polite"
    >
      <div className="ls-orb ls-orb-1" />
      <div className="ls-orb ls-orb-2" />
      <div className="ls-orb ls-orb-3" />

      <div className="ls-card">
        <div className="ls-grid" aria-hidden="true">
          {Array.from({ length: SLOTS }).map((_, i) => (
            <div
              key={i}
              className={`ls-slot ${i === BOOKED ? 'ls-booked' : ''}`}
              style={{ '--i': i }}
            >
              {i === BOOKED && (
                <svg viewBox="0 0 24 24" className="ls-check">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>

        <h1 className="ls-title">Faculty Resource Reservation</h1>
        <p className="ls-message" key={msgIndex}>
          {MESSAGES[msgIndex]}
          <span className="ls-dots">
            <i />
            <i />
            <i />
          </span>
        </p>

        <div className="ls-bar">
          <div className={knownProgress ? 'ls-bar-fill' : 'ls-bar-fill ls-bar-fill--indeterminate'} style={knownProgress ? {width: `${shown}%`} : undefined} />
        </div>
        {knownProgress && <span className="ls-percent">{Math.round(shown)}%</span>}
      </div>
    </div>
  );
}
