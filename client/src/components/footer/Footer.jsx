import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUp, ArrowUpRight, GraduationCap, Pause, Play, ShieldCheck } from 'lucide-react';
import { getCurrentUser, isAuthenticated } from '../../config/api';
import uniLogo from '../../assets/images/uni_logo.png';
import Aurora from './Aurora';
import './FooterFrame.css';

const AURORA_COLORS = ['#1a4d8f', '#faea09', '#087995'];

export default function Footer() {
  const location = useLocation();
  const root = useRef(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let user = null;
  try { user = isAuthenticated() ? getCurrentUser() : null; } catch { /* A malformed local session is treated as a guest. */ }
  const loggedIn = Boolean(user);
  const admin = user?.role === 'admin';
  const dashboard = admin ? '/admin' : '/student';
  const workspace = admin
    ? [{ name: 'Dashboard', to: '/admin' }, { name: 'Manage resources', to: '/resource-management' }, { name: 'Booking history', to: '/booking-history' }, { name: 'Manage users', to: '/user-management' }]
    : [{ name: 'Dashboard', to: loggedIn ? '/student' : '/login' }, { name: 'Browse resources', to: loggedIn ? '/browse-resources' : '/login' }, { name: 'My reservations', to: loggedIn ? '/my-reservations' : '/login' }, { name: loggedIn ? 'My profile' : 'Create an account', to: loggedIn ? '/student-profile' : '/register' }];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  const homeSectionClick = (event, id) => {
    if (location.pathname !== '/') return;
    const target = document.getElementById(id);
    if (target) { event.preventDefault(); target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  };

  return <>
    <footer ref={root} className="uf-footer" aria-label="Site footer">
      <div className="uf-frame">
        <div className="uf-aurora" aria-hidden="true"><Aurora colorStops={AURORA_COLORS} amplitude={0.75} blend={0.65} speed={0.35} paused={paused || reduced || !visible}/></div>
        <div className="uf-shade" aria-hidden="true"/>
        <div className="uf-content">
          <div className="uf-main">
            <div className="uf-statement"><span className="uf-eyebrow"><GraduationCap size={16}/> OUR CAMPUS. OUR POSSIBILITIES.</span><h2>Make space for<br/><em>what matters.</em></h2><p>The space to teach. The tools to discover.<br/>Every faculty resource, closer to you.</p><Link to={loggedIn ? dashboard : '/register'} className="uf-cta">{loggedIn ? 'Open your workspace' : 'Get started'}<ArrowRight size={17}/></Link></div>
            <div className="uf-links"><nav aria-label="Footer explore"><h3>Explore</h3><Link to="/">Home</Link><Link to="/#fr-resources" onClick={e=>homeSectionClick(e,'fr-resources')}>Faculty resources</Link><Link to="/#fr-how" onClick={e=>homeSectionClick(e,'fr-how')}>How it works</Link><Link to="/#fr-features" onClick={e=>homeSectionClick(e,'fr-features')}>Why choose us</Link></nav>
              <nav aria-label="Footer workspace"><h3>Your workspace</h3>{workspace.map(link=><Link key={link.name} to={link.to}>{link.name}</Link>)}</nav>
              <nav aria-label="Footer support"><h3>Here to help</h3><Link to="/help" onClick={event => { if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); window.dispatchEvent(new Event('open-support')); } }}>Help & Support</Link><Link to="/legal">Terms & privacy <ArrowUpRight size={12}/></Link></nav>
            </div>
          </div>
          <div className="uf-brand-row"><Link to="/" className="uf-brand" aria-label="Faculty Resources Reservation System home"><img src={uniLogo} alt="" width="61" height="61"/><span><strong>Faculty Resources<br/>Reservation System</strong><small>University of Sri Jayewardenepura</small></span></Link><span className="uf-community"><ShieldCheck size={16}/> Built for our faculty community.</span></div>
          <div className="uf-bottom"><span>© {new Date().getFullYear()} Faculty Resources Reservation System</span><Link to="/legal#privacy">Privacy policy</Link><Link to="/legal#terms">Terms of use</Link><div className="uf-controls"><button type="button" className="uf-motion" onClick={()=>setPaused(value=>!value)} disabled={reduced} aria-label={paused ? 'Play footer animation' : 'Pause footer animation'} title={reduced ? 'Reduced motion is enabled' : undefined}>{paused || reduced ? <Play size={12}/> : <Pause size={12}/>}</button><button type="button" className="uf-top" onClick={()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'})}>Back to top <ArrowUp size={14}/></button></div></div>
        </div>
      </div>
    </footer>
  </>;
}
