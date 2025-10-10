import { useEffect } from "react";

export default function useNavbar() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const navIndicator = document.getElementById("nav-indicator");
    const navItems = document.querySelectorAll(".nav-item");
    const navLinks = document.getElementById("nav-links");

    if (!navbar || !navIndicator || navItems.length === 0 || !navLinks) return;

    // Scroll effect
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Update nav indicator
    const updateNavIndicator = (activeItem) => {
      const rect = activeItem.getBoundingClientRect();
      const navRect = navLinks.getBoundingClientRect();
      const left = rect.left - navRect.left;
      const width = rect.width;

      navIndicator.style.left = left + "px";
      navIndicator.style.width = width + "px";
    };

    // Initialize nav indicator
    const initNavIndicator = () => {
      const activeItem = document.querySelector(".nav-item.active");
      if (activeItem) {
        updateNavIndicator(activeItem);
      }
    };

    // Click events for nav items
    const handleNavItemClick = (item) => () => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
      updateNavIndicator(item);
      localStorage.setItem("activeSection", item.dataset.section);
    };

    navItems.forEach((item) => item.addEventListener("click", handleNavItemClick(item)));

    // Restore active section on load
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

    // Handle window resize
    const handleResize = () => {
      const activeItem = document.querySelector(".nav-item.active");
      if (activeItem) updateNavIndicator(activeItem);
    };

    window.addEventListener("resize", handleResize);

    // Animate nav links on hover
    const navLinksAnchors = document.querySelectorAll(".nav-links a");
    const handleMouseEnter = (e) => (e.target.style.transform = "translateY(-2px)");
    const handleMouseLeave = (e) => (e.target.style.transform = "translateY(0)");

    navLinksAnchors.forEach((link) => {
      link.addEventListener("mouseenter", handleMouseEnter);
      link.addEventListener("mouseleave", handleMouseLeave);
    });

    // Cleanup event listeners
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      navItems.forEach((item) => item.removeEventListener("click", handleNavItemClick(item)));
      navLinksAnchors.forEach((link) => {
        link.removeEventListener("mouseenter", handleMouseEnter);
        link.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);
}
