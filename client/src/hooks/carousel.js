// Auto-scrolling carousel functionality
const featuresSection = document.getElementById('features-section');
const carouselTrack = document.getElementById('carousel-track');
let animationStarted = false;

// Intersection Observer to start animation when section is visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !animationStarted) {
            animationStarted = true;
        }
    });
}, {
    threshold: 0.3
});

if (featuresSection) {
    observer.observe(featuresSection);
}

// Pause animation on hover
if (carouselTrack) {
    carouselTrack.addEventListener('mouseenter', () => {
        carouselTrack.classList.add('paused');
    });

    carouselTrack.addEventListener('mouseleave', () => {
        carouselTrack.classList.remove('paused');
    });
}

// Add click events to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
        console.log('Feature card clicked:', card.querySelector('h3').textContent);
    });
});