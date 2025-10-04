// src/hooks/useCarousel.js
import { useEffect } from "react";

export default function useCarousel() {
  useEffect(() => {
    const featuresSection = document.getElementById("features-section");
    const carouselTrack = document.getElementById("carousel-track");
    let animationStarted = false;

    // Intersection Observer to trigger animation
    let observer;
    if (featuresSection) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !animationStarted) {
              animationStarted = true;
              // You can trigger CSS animations or JS logic here if needed
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(featuresSection);
    }

    // Pause animation on hover
    const handleMouseEnter = () => carouselTrack?.classList.add("paused");
    const handleMouseLeave = () => carouselTrack?.classList.remove("paused");

    if (carouselTrack) {
      carouselTrack.addEventListener("mouseenter", handleMouseEnter);
      carouselTrack.addEventListener("mouseleave", handleMouseLeave);
    }

    // Add click events to feature cards
    const featureCards = document.querySelectorAll(".feature-card");
    const handleCardClick = (e) => {
      const title = e.currentTarget.querySelector("h3")?.textContent;
      console.log("Feature card clicked:", title);
    };

    featureCards.forEach((card) => {
      card.addEventListener("click", handleCardClick);
    });

    // Cleanup
    return () => {
      if (observer && featuresSection) {
        observer.unobserve(featuresSection);
      }
      if (carouselTrack) {
        carouselTrack.removeEventListener("mouseenter", handleMouseEnter);
        carouselTrack.removeEventListener("mouseleave", handleMouseLeave);
      }
      featureCards.forEach((card) => {
        card.removeEventListener("click", handleCardClick);
      });
    };
  }, []);
}
