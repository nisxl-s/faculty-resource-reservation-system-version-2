//Fade-scrolling animation

function initFadeScroll() {
    // Get all elements with fade classes
    const fadeElements = document.querySelectorAll('.fade-scroll, .fade-scroll-move');
    
    // Function to handle scroll events
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        fadeElements.forEach(element => {
            // Get configuration from data attributes
            const fadeStart = parseInt(element.dataset.fadeStart) || 100;
            const fadeDistance = parseInt(element.dataset.fadeDistance) || 200;
            const fadeMin = parseFloat(element.dataset.fadeMin) || 0;
            
            // Calculate opacity based on scroll position
            if (scrollTop < fadeStart) {
                // Before fade starts - full opacity
                element.style.opacity = 1;
                if (element.classList.contains('fade-scroll-move')) {
                    element.style.transform = 'translateY(0)';
                }
            } else if (scrollTop >= fadeStart + fadeDistance) {
                // After fade ends - minimum opacity
                element.style.opacity = fadeMin;
                if (element.classList.contains('fade-scroll-move')) {
                    element.style.transform = 'translateY(-20px)';
                }
            } else {
                // During fade - calculate opacity
                const fadeProgress = (scrollTop - fadeStart) / fadeDistance;
                const opacity = Math.max(fadeMin, 1 - fadeProgress);
                element.style.opacity = opacity;
                
                // Add movement for fade-scroll-move elements
                if (element.classList.contains('fade-scroll-move')) {
                    const moveDistance = fadeProgress * 50; // 50px max movement
                    element.style.transform = `translateY(-${moveDistance}px)`;
                }
            }
        });
    }
    
    // Add scroll event listener with performance optimization
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
            setTimeout(() => ticking = false, 16); // ~60fps
        }
    });
    
    // Call once on page load
    handleScroll();
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFadeScroll);
} else {
    initFadeScroll();
}



    //=========================scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });





//extra

// function addFadeToElement(element, options = {}) {
//     element.classList.add('fade-scroll-move');
//     element.setAttribute('data-fade-start', options.fadeStart || 100);
//     element.setAttribute('data-fade-distance', options.fadeDistance || 200);
//     element.setAttribute('data-fade-min', options.fadeMin || 0);
    
//     // Reinitialize
//     initFadeScroll();
// }