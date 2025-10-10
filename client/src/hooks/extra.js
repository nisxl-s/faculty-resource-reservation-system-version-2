 
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

        // =======================Show/hide scroll to top button
        const scrollTopBtn = document.querySelector('.scroll-top');
        
       /* window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                scrollTopBtn.classList.add('active');
            } else {
                scrollTopBtn.classList.remove('active');
            }
        });*/

        // =========================Scroll to top functionality
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // =============================Animate skill bars on scroll
        const skillBars = document.querySelectorAll('.skill-progress');
        
        function animateSkillBars() {
            skillBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }

        // ==================Intersection Observer for skill bars animation
        const skillsSection = document.querySelector('#education-skills');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(skillsSection);

        // =======================================Form submission (demo only)
        const contactForm = document.getElementById('contactForm');
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! This is a demo form.');
            contactForm.reset();
        });







// ScrollReveal base options
const scrollRevealOption = {
  distance: "50px",
  duration: 1000,
  easing: "ease-in-out",
  origin: "bottom",
  reset: false,
};



// Header and navbar
ScrollReveal().reveal("header", {
  ...scrollRevealOption,
  origin: "top",
});

// Hero section
ScrollReveal().reveal(".hero", {
  ...scrollRevealOption,
  origin: "bottom",
  delay: 300,
});
ScrollReveal().reveal(".hero-content fade-scroll-move h1", {
  ...scrollRevealOption,
  origin: "left",
  delay: 300,
});

//login and register
ScrollReveal().reveal(".content", {
  ...scrollRevealOption,
  origin: "bottom",
  delay: 300,
});



// Footer section
ScrollReveal().reveal(".containerF", {
  ...scrollRevealOption,
  origin: "bottom",
  delay: 300,
});






window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  const logoImg = document.querySelector(".img-shrink-on-scroll");

  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
    logoImg.classList.add("shrink");
  } else {
    navbar.classList.remove("scrolled");
    logoImg.classList.remove("shrink");
  }
});
