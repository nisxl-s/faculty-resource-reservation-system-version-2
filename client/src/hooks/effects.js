import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useNavbarEffects(activeDep) {
	useIsomorphicLayoutEffect(() => {
		const navbar = document.getElementById('navbar');
		const navIndicator = document.getElementById('nav-indicator');
		const navLinks = document.getElementById('nav-links');

		function onScroll() {
			if (!navbar) return;
			const wasScrolled = navbar.classList.contains('scrolled');
			const isScrolled = window.scrollY > 50;
			if (isScrolled !== wasScrolled) {
				if (isScrolled) navbar.classList.add('scrolled');
				else navbar.classList.remove('scrolled');
				updateNavIndicator();
			}
		}

		if (!navIndicator || !navLinks) {
			window.addEventListener('scroll', onScroll);
			onScroll();
			return () => {
				window.removeEventListener('scroll', onScroll);
			};
		}

		function getLinkRect(activeItem) {
			if (!activeItem || !navLinks) return null;
			const ir = activeItem.getBoundingClientRect();
			const cr = navLinks.getBoundingClientRect();
			if (ir.width === 0 || cr.width === 0) return null;
			return {
				left: ir.left - cr.left - (navLinks.clientLeft || 0),
				top: ir.top - cr.top - (navLinks.clientTop || 0),
				width: ir.width,
				height: ir.height,
			};
		}

		// Snap pill directly to active element synchronously without animated travel
		function snapToActive(makeVisible = true) {
			const activeItem = navLinks.querySelector('.nav-item.active, a.active');
			if (!activeItem) {
				navIndicator.style.opacity = '0';
				return;
			}
			const rect = getLinkRect(activeItem);
			if (!rect) {
				requestAnimationFrame(() => snapToActive(makeVisible));
				return;
			}

			navIndicator.style.transition = 'none';
			navIndicator.classList.remove('floating');
			navIndicator.style.left = `${rect.left}px`;
			navIndicator.style.top = `${rect.top}px`;
			navIndicator.style.width = `${rect.width}px`;
			navIndicator.style.height = `${rect.height}px`;
			if (makeVisible) {
				navIndicator.style.opacity = '1';
			}

			void navIndicator.offsetWidth;
			navIndicator.style.transition = '';
		}

		function updateNavIndicator() {
			const activeItem = navLinks.querySelector('.nav-item.active, a.active');
			if (!activeItem || !navIndicator) {
				if (navIndicator) navIndicator.style.opacity = '0';
				return;
			}
			const rect = getLinkRect(activeItem);
			if (!rect) return;

			navIndicator.style.left = `${rect.left}px`;
			navIndicator.style.top = `${rect.top}px`;
			navIndicator.style.width = `${rect.width}px`;
			navIndicator.style.height = `${rect.height}px`;
			navIndicator.style.opacity = '1';
		}

		// If transitioning from a previous active tab position, animate glide from there!
		if (window.__lastNavIndicator) {
			const prevRect = window.__lastNavIndicator;
			window.__lastNavIndicator = null;

			// Position indicator at previous tab's coordinates synchronously
			navIndicator.style.transition = 'none';
			navIndicator.style.left = `${prevRect.left}px`;
			navIndicator.style.top = `${prevRect.top}px`;
			navIndicator.style.width = `${prevRect.width}px`;
			navIndicator.style.height = `${prevRect.height}px`;
			navIndicator.style.opacity = '1';
			void navIndicator.offsetWidth;

			// Re-enable smooth transition and glide to current tab on next frame
			navIndicator.style.transition = '';
			requestAnimationFrame(() => {
				updateNavIndicator();
			});
		} else {
			snapToActive(true);
		}

		// Settling passes for images/fonts without disabling transitions or thrashing reflow
		const rAF1 = requestAnimationFrame(() => updateNavIndicator());
		const t1 = setTimeout(() => updateNavIndicator(), 80);
		const t2 = setTimeout(() => updateNavIndicator(), 250);

		const onWindowLoad = () => updateNavIndicator();
		window.addEventListener('load', onWindowLoad);

		// After fonts settle, ensure perfect alignment
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(() => {
				updateNavIndicator();
			});
		}

		// ResizeObserver to track layout/size changes smoothly
		let resizeObserver = null;
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => {
				updateNavIndicator();
			});
			resizeObserver.observe(navLinks);
			if (navbar) resizeObserver.observe(navbar);
		}

		const onResize = () => updateNavIndicator();

		window.addEventListener('scroll', onScroll);
		window.addEventListener('resize', onResize);
		onScroll();

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('load', onWindowLoad);
			cancelAnimationFrame(rAF1);
			clearTimeout(t1);
			clearTimeout(t2);
			if (resizeObserver) resizeObserver.disconnect();
		};
	}, [activeDep]);
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
		burger.setAttribute('aria-expanded', 'false');

		const onClick = () => {
			navLinks.classList.toggle('active');
			burger.classList.toggle('toggle');
			burger.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
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
					// I can add a start class here if the carousel needs one.
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

/**
 * Clean up any shift classes on mount without asynchronous class insertion flickers.
 */
export function useSectionEnter() {
	useEffect(() => {
		const el = document.querySelector('[data-section-content]');
		if (!el) return;
		el.classList.remove(
			'section-shift-exit-forward',
			'section-shift-exit-backward',
			'section-shift-enter-forward',
			'section-shift-enter-backward'
		);
	}, []);
}