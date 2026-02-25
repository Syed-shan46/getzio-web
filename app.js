/**
 * Getzio Web Interactions
 * 
 * Handles:
 * - Mobile Menu Toggle
 * - Intersection Observer for scroll animations
 * - Smooth scrolling for anchor links
 * - Navigation background transitions
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Mobile Menu Functionality
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('hidden');
        if (!mobileMenu.classList.contains('hidden')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    };

    menuBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
    });

    // 2. Scroll Reveal Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Once visible, we can unobserve if we don't need re-animation
                // revealObserver.unobserve(entry.target); 
            } else {
                // Re-enable if you want animation every time you scroll up/down
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // 3. Navigation Styling on Scroll
    const nav = document.querySelector('nav');

    const handleScroll = () => {
        if (window.scrollY > 40) {
            nav.classList.add('py-2', 'shadow-xl', 'bg-white/95');
            nav.classList.remove('py-4', 'bg-white/70');
        } else {
            nav.classList.remove('py-2', 'shadow-xl', 'bg-white/95');
            nav.classList.add('py-4', 'bg-white/70');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    // 4. Smooth Scrolling Extension (Optional since we use scroll-smooth in HTML)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 5. Parallax Effect for Hero Floating Icons (Subtle)
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        const floatingElements = document.querySelectorAll('.animate-float');
        floatingElements.forEach(el => {
            const speed = 25;
            el.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
        });
    });
});
