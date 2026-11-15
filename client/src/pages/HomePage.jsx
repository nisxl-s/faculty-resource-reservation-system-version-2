import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Building2, Check, FlaskConical, GraduationCap, Menu, Monitor, Play, ShieldCheck, Users, X, ChevronDown, LayoutDashboard } from 'lucide-react';
import { getCurrentUser, isAuthenticated } from '../config/api';
import uniLogo from '../assets/images/uni_logo.png';
import campus from '../assets/images/about_us_bg.jpg';
import '../assets/css/landing.css';
import ResourceShowcase from '../components/ResourceShowcase';
import HowItWorksCards from '../components/HowItWorksCards';
import WhyChooseUs from '../components/WhyChooseUs';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function HomePage() {
  const root = useRef(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const playing = !paused && !reduced;
  const user = isAuthenticated() ? getCurrentUser() : null;
  const dashboard = user?.role === 'admin' ? '/admin' : '/student';
  const workspaceLinks = user?.role === 'admin'
    ? [{ label: 'Dashboard', to: '/admin' }, { label: 'Manage users', to: '/user-management' }, { label: 'Manage resources', to: '/resource-management' }, { label: 'Reservations', to: '/booking-history' }, { label: 'Notifications', to: '/notify' }, { label: 'My profile', to: '/profile' }]
    : [{ label: 'Dashboard', to: '/student' }, { label: 'Browse resources', to: '/browse-resources' }, { label: 'My reservations', to: '/my-reservations' }, { label: 'My profile', to: '/student-profile' }];
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const workspaceRef = useRef(null);
  const workspaceTrigger = useRef(null);
  useEffect(() => {
    const close = event => { if (!workspaceRef.current?.contains(event.target)) setWorkspaceOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    root.current.querySelectorAll('[data-reveal]').forEach(el => { if (!reduced) { el.classList.add('fr-reveal-ready'); observer.observe(el); } else el.classList.add('is-visible'); });
    return () => observer.disconnect();
  }, [reduced]);

  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['fr-main', 'fr-resources', 'fr-how', 'fr-features'].includes(hash)) {
        return hash;
      }
    }
    return 'fr-main';
  });

  const isManualScrollRef = useRef(false);
  const manualTimerRef = useRef(null);
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  const updatePillIndicator = useCallback((animated = true) => {
    const nav = document.getElementById('fr-pill-nav');
    const indicator = document.getElementById('fr-pill-indicator');
    if (!nav || !indicator) return;

    const currentSection = activeSectionRef.current;
    const activeLink = nav.querySelector(`.fr-pill-link[data-section="${currentSection}"]`) ||
                       nav.querySelector('.fr-pill-link.is-active') ||
                       nav.querySelector('.fr-pill-link');
    if (!activeLink) return;

    const navRect = nav.getBoundingClientRect();
    const elRect = activeLink.getBoundingClientRect();
    if (elRect.width === 0 || navRect.width === 0) return;

    if (!animated) {
      indicator.style.transition = 'none';
    } else {
      indicator.style.transition = '';
    }

    indicator.style.left = `${elRect.left - navRect.left - nav.clientLeft + nav.scrollLeft}px`;
    indicator.style.top = `${elRect.top - navRect.top - nav.clientTop + nav.scrollTop}px`;
    indicator.style.width = `${elRect.width}px`;
    indicator.style.height = `${elRect.height}px`;
    indicator.style.opacity = '1';

    if (!animated) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }, []);

  // Update indicator position whenever the active section changes
  useEffect(() => {
    updatePillIndicator(true);
  }, [activeSection, updatePillIndicator]);

  // Initial layout snap, resize observer, and font settling
  useEffect(() => {
    updatePillIndicator(false);

    const rAF = requestAnimationFrame(() => updatePillIndicator(false));
    const t1 = setTimeout(() => updatePillIndicator(false), 80);
    const t2 = setTimeout(() => updatePillIndicator(false), 250);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => updatePillIndicator(false));
    }

    const nav = document.getElementById('fr-pill-nav');
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && nav) {
      resizeObserver = new ResizeObserver(() => updatePillIndicator(false));
      resizeObserver.observe(nav);
    }

    const onResize = () => updatePillIndicator(false);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [updatePillIndicator]);

  // Scrollspy: update active section and glide pill as user scrolls down/up
  useEffect(() => {
    let ticking = false;

    const checkActiveSection = () => {
      if (isManualScrollRef.current) return;

      // Bottom of page detection (highlights Why Choose Us)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70;
      if (atBottom) {
        if (activeSectionRef.current !== 'fr-features') {
          setActiveSection('fr-features');
        }
        return;
      }

      // Top of page detection (Home)
      if (window.scrollY < 80) {
        if (activeSectionRef.current !== 'fr-main') {
          setActiveSection('fr-main');
        }
        return;
      }

      // Trigger offset below the sticky header (~80-110px)
      const activationOffset = Math.min(240, Math.max(140, window.innerHeight * 0.28));

      const featuresEl = document.getElementById('fr-features');
      if (featuresEl && featuresEl.getBoundingClientRect().top <= activationOffset) {
        if (activeSectionRef.current !== 'fr-features') {
          setActiveSection('fr-features');
        }
        return;
      }

      const howEl = document.getElementById('fr-how');
      if (howEl && howEl.getBoundingClientRect().top <= activationOffset) {
        if (activeSectionRef.current !== 'fr-how') {
          setActiveSection('fr-how');
        }
        return;
      }

      const resourcesEl = document.getElementById('fr-resources');
      if (resourcesEl && resourcesEl.getBoundingClientRect().top <= activationOffset) {
        if (activeSectionRef.current !== 'fr-resources') {
          setActiveSection('fr-resources');
        }
        return;
      }

      if (activeSectionRef.current !== 'fr-main') {
        setActiveSection('fr-main');
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkActiveSection();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, []);

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setActiveSection(sectionId);
    isManualScrollRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 900);

    if (sectionId === 'fr-main') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (window.history.pushState) {
      window.history.pushState(null, '', `#${sectionId}`);
    }
  };

  return <div ref={root} className={`fr-landing ${playing ? '' : 'fr-motion-paused'}`}>
    <a className="fr-skip" href="#fr-main">Skip to content</a>
    <header className={`fr-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="fr-nav" aria-label="Main navigation">
        <Link to="/" className="fr-brand nav-brand-group" aria-label="Faculty Resources Reservation System home">
          <img src={uniLogo} alt="University of Sri Jayewardenepura Logo" width="94" height="94" className="nav-logo-img fr-brand-logo" />
          <div className="logo fr-brand-title">
            <h3>Faculty Resources Reservation System</h3>
            <span>University of Sri Jayewardenepura</span>
          </div>
        </Link>
        <div className="fr-desktop-links" role="navigation" aria-label="Page sections">
          <div className="fr-pill-nav" id="fr-pill-nav">
            <span className="fr-pill-indicator" id="fr-pill-indicator" />
            <a
              href="#fr-main"
              data-section="fr-main"
              className={`fr-pill-link ${activeSection === 'fr-main' ? 'is-active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fr-main')}
            >
              Home
            </a>
            <a
              href="#fr-resources"
              data-section="fr-resources"
              className={`fr-pill-link ${activeSection === 'fr-resources' ? 'is-active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fr-resources')}
            >
              Resources
            </a>
            <a
              href="#fr-how"
              data-section="fr-how"
              className={`fr-pill-link ${activeSection === 'fr-how' ? 'is-active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fr-how')}
            >
              How it works
            </a>
            <a
              href="#fr-features"
              data-section="fr-features"
              className={`fr-pill-link ${activeSection === 'fr-features' ? 'is-active' : ''}`}
              onClick={(e) => handleNavClick(e, 'fr-features')}
            >
              Why Choose Us
            </a>
          </div>
        </div>
        <div className="fr-nav-actions">{user ? <>
          <div className="fr-workspace" ref={workspaceRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setWorkspaceOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { setWorkspaceOpen(false); workspaceTrigger.current?.focus(); } }}>
            <button ref={workspaceTrigger} type="button" className="fr-login fr-workspace-trigger" aria-expanded={workspaceOpen} aria-controls="fr-workspace-links" onClick={() => setWorkspaceOpen(open => !open)}>My workspace <ChevronDown size={15}/></button>
            {workspaceOpen && <nav id="fr-workspace-links" className="fr-workspace-links" aria-label="Your workspace"><span>{user.role === 'admin' ? 'ADMIN WORKSPACE' : 'YOUR WORKSPACE'}</span>{workspaceLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setWorkspaceOpen(false)}>{link.label}<ArrowUpRight size={14}/></Link>)}</nav>}
          </div>
          <Link to={dashboard} className="fr-button fr-button-small"><LayoutDashboard size={16}/> Dashboard</Link>
        </> : <><Link to="/login" className="fr-login">Log in</Link><Link to="/register" className="fr-button fr-button-small">Get started <ArrowUpRight size={16} /></Link></>}<button className="fr-menu-toggle" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="fr-mobile-menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
        {menu && <div id="fr-mobile-menu" className="fr-mobile-menu" onKeyDown={e => { if (e.key === 'Escape') setMenu(false); }}><a href="#fr-main" className={activeSection === 'fr-main' ? 'is-active' : ''} onClick={(e) => { handleNavClick(e, 'fr-main'); setMenu(false); }}>Home</a><a href="#fr-resources" className={activeSection === 'fr-resources' ? 'is-active' : ''} onClick={(e) => { handleNavClick(e, 'fr-resources'); setMenu(false); }}>Resources</a><a href="#fr-how" className={activeSection === 'fr-how' ? 'is-active' : ''} onClick={(e) => { handleNavClick(e, 'fr-how'); setMenu(false); }}>How it works</a><a href="#fr-features" className={activeSection === 'fr-features' ? 'is-active' : ''} onClick={(e) => { handleNavClick(e, 'fr-features'); setMenu(false); }}>Why Choose Us</a>{user ? <div className="fr-mobile-workspace"><span>Your workspace</span>{workspaceLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setMenu(false)}>{link.label}</Link>)}</div> : <><Link to="/login">Log in</Link><Link to="/register">Get started</Link></>}</div>}
      </nav>
    </header>
    <main id="fr-main">
      <section className="fr-hero">
        <div className="fr-hero-copy"><span className="fr-eyebrow"><span className="fr-dot" /> BUILT FOR YOUR FACULTY</span><h1>Less coordinating.<br />More <span>possibilities.</span></h1><p>The space to teach. The tools to discover. Bring your campus plans to life with every faculty resource in one place.</p><div className="fr-actions"><Link to={user ? dashboard : '/register'} className="fr-button">{user ? 'Open your dashboard' : 'Get started'} <ArrowRight size={18} /></Link><a href="#fr-resources" className="fr-button fr-button-outline"><Play size={16} /> Explore the experience</a></div><span className="fr-hero-note"><ShieldCheck size={15} /> Built for the University of Sri Jayewardenepura community</span></div>
        <ResourceShowcase reduced={reduced} paused={paused} onTogglePause={() => setPaused(value => !value)} />
      </section>
      <div className="fr-resource-strip" data-reveal><span>ONE PLACE FOR YOUR CAMPUS ESSENTIALS</span><div>{[{ Icon: Building2, label: 'Lecture halls' }, { Icon: Users, label: 'Seminar rooms' }, { Icon: FlaskConical, label: 'Laboratories' }, { Icon: Monitor, label: 'Equipment' }].map(({ Icon, label }) => <span key={label}><Icon size={23} />{label}</span>)}</div></div>
      <HowItWorksCards reduced={reduced} paused={paused} />
      <WhyChooseUs reduced={reduced} paused={paused} onTogglePause={() => setPaused(value => !value)} />
      <section className="fr-section fr-campus" data-reveal><div className="fr-campus-image"><img src={campus} alt="Close-up of a keyboard, representing shared faculty technology" loading="lazy" /><div><img src={uniLogo} alt="" /><span>University of<br /><strong>Sri Jayewardenepura</strong></span></div></div><div className="fr-campus-copy"><span className="fr-eyebrow">OUR CAMPUS. OUR POSSIBILITIES.</span><h2>Shared resources.<br /><em>Greater potential.</em></h2><p>Designed around the people who teach, learn, and create here. Faculty Reserve brings campus resources closer to the community that needs them.</p><div><BookOpen size={20} /><span>More room for learning.</span></div><div><Users size={20} /><span>More opportunities to collaborate.</span></div><div><GraduationCap size={20} /><span>More time for what matters.</span></div><Link to={user ? dashboard : '/register'} className="fr-text-link">{user ? 'Back to your workspace' : 'Join your faculty community'} <ArrowUpRight size={18} /></Link></div></section>
      <section className="fr-final" data-reveal><span className="fr-eyebrow">YOUR NEXT SESSION STARTS HERE</span><h2>Make space for<br /><em>what matters.</em></h2><p>Your next lecture, workshop, or breakthrough.<br />It all starts with the right resource.</p><Link to={user ? dashboard : '/register'} className="fr-button">{user ? 'Open your dashboard' : 'Get started'} <ArrowRight size={18} /></Link><div className="fr-marquee" aria-label="Spaces for teaching, research, collaboration, and discovery"><div>{[0, 1].map(copy => <div className="fr-marquee-group" key={copy} aria-hidden="true">{[{ Icon: Building2, label: 'A space to teach' }, { Icon: FlaskConical, label: 'A place to discover' }, { Icon: Users, label: 'Room to collaborate' }, { Icon: Monitor, label: 'Tools to create' }].map(({ Icon, label }) => <span key={label}><Icon size={22} />{label}<Check size={17} /></span>)}</div>)}</div></div></section>
    </main>
    
  </div>;
}
