import { useEffect } from 'react';

export function useNavbarEffects() {
	useEffect(() => {
		const navbar = document.getElementById('navbar');
		const navIndicator = document.getElementById('nav-indicator');
		const navItems = document.querySelectorAll('.nav-item');

		function onScroll() {
			if (!navbar) return;
			if (window.scrollY > 50) navbar.classList.add('scrolled');
			else navbar.classList.remove('scrolled');
		}

		function updateIndicator(activeItem) {
			if (!navIndicator) return;
			const navLinks = document.getElementById('nav-links');
			if (!navLinks || !activeItem) return;
			const rect = activeItem.getBoundingClientRect();
			const navRect = navLinks.getBoundingClientRect();
			navIndicator.style.left = rect.left - navRect.left + 'px';
			navIndicator.style.width = rect.width + 'px';
		}

		function initIndicator() {
			const activeItem = document.querySelector('.nav-item.active');
			if (activeItem) updateIndicator(activeItem);
		}

		const clickHandlers = [];
		navItems.forEach(item => {
			const handler = () => {
				navItems.forEach(n => n.classList.remove('active'));
				item.classList.add('active');
				updateIndicator(item);
				if (item.dataset.section) localStorage.setItem('activeSection', item.dataset.section);
			};
			item.addEventListener('click', handler);
			clickHandlers.push({ item, handler });
		});

		function restoreActive() {
			const activeSection = localStorage.getItem('activeSection');
			if (activeSection) {
				navItems.forEach(item => {
					item.classList.remove('active');
					if (item.dataset.section === activeSection) item.classList.add('active');
				});
			}
			initIndicator();
		}

		function onResize() {
			const activeItem = document.querySelector('.nav-item.active');
			if (activeItem) updateIndicator(activeItem);
		}

		const links = document.querySelectorAll('.nav-links a');
		const enterHandlers = [];
		const leaveHandlers = [];
		links.forEach(link => {
			const enter = () => { link.style.transform = 'translateY(-2px)'; };
			const leave = () => { link.style.transform = 'translateY(0)'; };
			link.addEventListener('mouseenter', enter);
			link.addEventListener('mouseleave', leave);
			enterHandlers.push({ link, enter });
			leaveHandlers.push({ link, leave });
		});

		window.addEventListener('scroll', onScroll);
		window.addEventListener('resize', onResize);
		restoreActive();
		onScroll();

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			clickHandlers.forEach(({ item, handler }) => item.removeEventListener('click', handler));
			enterHandlers.forEach(({ link, enter }) => link.removeEventListener('mouseenter', enter));
			leaveHandlers.forEach(({ link, leave }) => link.removeEventListener('mouseleave', leave));
		};
	}, []);
}

export function useFadeScroll() {
	useEffect(() => {
		const fadeElements = document.querySelectorAll('.fade-scroll, .fade-scroll-move');

		function handleScroll() {
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			fadeElements.forEach(element => {
				const fadeStart = parseInt(element.dataset.fadeStart) || 100;
				const fadeDistance = parseInt(element.dataset.fadeDistance) || 200;
				const fadeMin = parseFloat(element.dataset.fadeMin) || 0;

				if (scrollTop < fadeStart) {
					element.style.opacity = 1;
					if (element.classList.contains('fade-scroll-move')) element.style.transform = 'translateY(0)';
				} else if (scrollTop >= fadeStart + fadeDistance) {
					element.style.opacity = fadeMin;
					if (element.classList.contains('fade-scroll-move')) element.style.transform = 'translateY(-20px)';
				} else {
					const fadeProgress = (scrollTop - fadeStart) / fadeDistance;
					const opacity = Math.max(fadeMin, 1 - fadeProgress);
					element.style.opacity = opacity;
					if (element.classList.contains('fade-scroll-move')) {
						const moveDistance = fadeProgress * 50;
						element.style.transform = `translateY(-${moveDistance}px)`;
					}
				}
			});
		}

		let ticking = false;
		function onScroll() {
			if (!ticking) {
				requestAnimationFrame(handleScroll);
				ticking = true;
				setTimeout(() => { ticking = false; }, 16);
			}
		}

		window.addEventListener('scroll', onScroll);
		handleScroll();

		// smooth scroll for in-page anchors
		const anchors = document.querySelectorAll('a[href^="#"]');
		const anchorHandlers = [];
		anchors.forEach(anchor => {
			const h = e => {
				e.preventDefault();
				const targetId = anchor.getAttribute('href');
				const el = document.querySelector(targetId);
				if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
			};
			anchor.addEventListener('click', h);
			anchorHandlers.push({ anchor, h });
		});

		return () => {
			window.removeEventListener('scroll', onScroll);
			anchorHandlers.forEach(({ anchor, h }) => anchor.removeEventListener('click', h));
		};
	}, []);
}

export function useMobileNav() {
	useEffect(() => {
		const burger = document.querySelector('.burger');
		const navLinks = document.querySelector('.nav-links');
		const navLinksItems = document.querySelectorAll('.nav-links li');

		if (!burger || !navLinks) return;

		const onClick = () => {
			navLinks.classList.toggle('active');
			burger.classList.toggle('toggle');
			navLinksItems.forEach((link, index) => {
				if (link.style.animation) link.style.animation = '';
				else link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
			});
		};
		burger.addEventListener('click', onClick);

		return () => burger.removeEventListener('click', onClick);
	}, []);
}

export function useCarouselEffects() {
	useEffect(() => {
		const featuresSection = document.getElementById('features-section');
		const carouselTrack = document.getElementById('carousel-track');
		let animationStarted = false;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !animationStarted) {
					animationStarted = true;
					// If you drive CSS animation via a class, add it here
					// carouselTrack?.classList.add('start');
				}
			});
		}, { threshold: 0.3 });

		if (featuresSection) observer.observe(featuresSection);

		function onEnter() { carouselTrack && carouselTrack.classList.add('paused'); }
		function onLeave() { carouselTrack && carouselTrack.classList.remove('paused'); }
		if (carouselTrack) {
			carouselTrack.addEventListener('mouseenter', onEnter);
			carouselTrack.addEventListener('mouseleave', onLeave);
		}

		const cards = document.querySelectorAll('.feature-card');
		const clickHandlers = [];
		cards.forEach(card => {
			const h = () => console.log('Feature card clicked:', card.querySelector('h3')?.textContent);
			card.addEventListener('click', h);
			clickHandlers.push({ card, h });
		});

		return () => {
			if (featuresSection) observer.disconnect();
			if (carouselTrack) {
				carouselTrack.removeEventListener('mouseenter', onEnter);
				carouselTrack.removeEventListener('mouseleave', onLeave);
			}
			clickHandlers.forEach(({ card, h }) => card.removeEventListener('click', h));
		};
	}, []);
}