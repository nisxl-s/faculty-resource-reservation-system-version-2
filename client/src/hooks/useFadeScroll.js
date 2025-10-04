// src/hooks/useFadeScroll.js
import { useEffect } from "react";

export default function useFadeScroll() {
  useEffect(() => {
    // Core fade scroll function from original JS
    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      document.querySelectorAll(".fade-scroll, .fade-scroll-move").forEach((element) => {
        const fadeStart = parseInt(element.dataset.fadeStart) || 100;
        const fadeDistance = parseInt(element.dataset.fadeDistance) || 200;
        const fadeMin = parseFloat(element.dataset.fadeMin) || 0;

        if (scrollTop < fadeStart) {
          element.style.opacity = 1;
          if (element.classList.contains("fade-scroll-move")) {
            element.style.transform = "translateY(0)";
          }
        } else if (scrollTop >= fadeStart + fadeDistance) {
          element.style.opacity = fadeMin;
          if (element.classList.contains("fade-scroll-move")) {
            element.style.transform = "translateY(-20px)";
          }
        } else {
          const fadeProgress = (scrollTop - fadeStart) / fadeDistance;
          const opacity = Math.max(fadeMin, 1 - fadeProgress);
          element.style.opacity = opacity;

          if (element.classList.contains("fade-scroll-move")) {
            const moveDistance = fadeProgress * 50; // max 50px movement
            element.style.transform = `translateY(-${moveDistance}px)`;
          }
        }
      });
    }

    // Performance-friendly scroll listener
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
        setTimeout(() => (ticking = false), 16); // ~60fps
      }
    };

    window.addEventListener("scroll", scrollListener);

    // Run once on mount
    handleScroll();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("scroll", scrollListener);
    };
  }, []);
}
