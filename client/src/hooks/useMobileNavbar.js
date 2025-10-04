// src/hooks/useMobileNavbar.js
import { useEffect } from "react";

export default function useMobileNavbar() {
  useEffect(() => {
    const burger = document.querySelector(".burger");
    const navLinks = document.querySelector(".nav-links");
    const navLinksItems = document.querySelectorAll(".nav-links li");

    if (!burger || !navLinks) return;

    const handleBurgerClick = () => {
      // Toggle nav visibility
      navLinks.classList.toggle("active");

      // Burger animation (toggle X icon)
      burger.classList.toggle("toggle");

      // Animate each nav link
      navLinksItems.forEach((link, index) => {
        if (link.style.animation) {
          link.style.animation = "";
        } else {
          link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        }
      });
    };

    burger.addEventListener("click", handleBurgerClick);

    return () => {
      burger.removeEventListener("click", handleBurgerClick);
    };
  }, []);
}
