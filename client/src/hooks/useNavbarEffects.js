// src/hooks/useNavbarEffects.js
import { useEffect } from "react";

export default function useNavbarEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const navIndicator = document.getElementById("nav-indicator");
    const navItems = document.querySelectorAll(".nav-item");
    const navLinksContainer = document.getElementById("nav-links");
    const navLinks = document.querySelectorAll(".nav-links a");

    // Scroll effect for navbar
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 50) {
        navbar?.classList.add("scrolled");
      } else {
        navbar?.classList.remove("scrolled");
      }
    };

    // Update indicator position
    const updateNavIndicator = (activeItem) => {
      if (!navIndicator || !activeItem || !navLinksContainer) return;
      const rect = activeItem.getBoundingClientRect();
      const navRect = navLinksContainer.getBoundingClientRect();

      const left = rect.left - navRect.left;
      const width = rect.width;

      navIndicator.style.left = `${left}px`;
      navIndicator.style.width = `${width}px`;
    };

    // Initialize indicator based on current active item
    const initNavIndicator = () => {
      const activeItem = document.querySelector(".nav-item.active");
      if (activeItem && navIndicator) {
        updateNavIndicator(activeItem);
      }
    };

    // Handle nav item clicks
    const handleNavItemClick = (item) => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
      updateNavIndicator(item);
      localStorage.setItem("activeSection", item.dataset.section);
    };

    navItems.forEach((item) => {
      item.addEventListener("click", () => handleNavItemClick(item));
    });

    // Restore active section on load
    const restoreActiveSection = () => {
      const activeSection = localStorage.getItem("activeSection");
      if (activeSection) {
        navItems.forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.section === activeSection) {
            item.classList.add("active");
          }
        });
      }
      initNavIndicator();
    };

    // Handle window resize
    const handleResize = () => {
      const activeItem = document.querySelector(".nav-item.active");
      if (activeItem) updateNavIndicator(activeItem);
    };

    // Hover animation for nav links
    const handleLinkEnter = (e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
    };
    const handleLinkLeave = (e) => {
      e.currentTarget.style.transform = "translateY(0)";
    };

    navLinks.forEach((link) => {
      link.addEventListener("mouseenter", handleLinkEnter);
      link.addEventListener("mouseleave", handleLinkLeave);
    });

    // Add listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    window.addEventListener("load", restoreActiveSection);

    // Run once on mount
    handleScroll();
    restoreActiveSection();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", restoreActiveSection);

      navItems.forEach((item) =>
        item.removeEventListener("click", () => handleNavItemClick(item))
      );

      navLinks.forEach((link) => {
        link.removeEventListener("mouseenter", handleLinkEnter);
        link.removeEventListener("mouseleave", handleLinkLeave);
      });
    };
  }, []);
}
