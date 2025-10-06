// src/hooks/useExtra.js
import { useEffect } from "react";
import ScrollReveal from "scrollreveal"; // make sure you have installed scrollreveal

export default function useExtra() {
  useEffect(() => {
    // ===== Scroll to sections on anchor click
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });
        }
      });
    });

    // ===== Scroll to top button
    const scrollTopBtn = document.querySelector(".scroll-top");
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }

    // ===== Animate skill bars
    const skillBars = document.querySelectorAll(".skill-progress");

    function animateSkillBars() {
      skillBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = "0";
        setTimeout(() => {
          bar.style.width = width;
        }, 100);
      });
    }

    const skillsSection = document.querySelector("#education-skills");
    if (skillsSection) {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateSkillBars();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(skillsSection);
    }

    // ===== Form submission demo
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", e => {
        e.preventDefault();
        alert("Thank you for your message! This is a demo form.");
        contactForm.reset();
      });
    }

    // ===== ScrollReveal animations
    const scrollRevealOption = {
      distance: "50px",
      duration: 1000,
      easing: "ease-in-out",
      origin: "bottom",
      reset: false,
    };

    ScrollReveal().reveal("header", { ...scrollRevealOption, origin: "top" });
    ScrollReveal().reveal(".hero", { ...scrollRevealOption, origin: "bottom", delay: 300 });
    ScrollReveal().reveal(".hero-content.fade-scroll-move h1", {
      ...scrollRevealOption,
      origin: "left",
      delay: 300,
    });
    ScrollReveal().reveal(".content", { ...scrollRevealOption, origin: "bottom", delay: 300 });
    ScrollReveal().reveal(".containerF", { ...scrollRevealOption, origin: "bottom", delay: 300 });

    // ===== Navbar scroll effect
    const navbar = document.getElementById("navbar");
    const logoImg = document.querySelector(".img-shrink-on-scroll");

    function handleNavbarScroll() {
      if (window.scrollY > 50) {
        navbar?.classList.add("scrolled");
        logoImg?.classList.add("shrink");
      } else {
        navbar?.classList.remove("scrolled");
        logoImg?.classList.remove("shrink");
      }
    }

    window.addEventListener("scroll", handleNavbarScroll);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("scroll", handleNavbarScroll);
    };
  }, []);
}
