/**
 * Getzio Web Interactions
 * 
 * Handles:
 * - Mobile Menu Toggle
 * - Intersection Observer for scroll animations
 * - Smooth scrolling for anchor links
 * - Navigation background transitions
 * - Onboarding Modal & Interest Form
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

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);

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
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // 3. Navigation Styling on Scroll
    const nav = document.querySelector('nav');

    const handleScroll = () => {
        if (!nav) return;
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

    // 4. Smooth Scrolling for anchor links
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

    // 5. Parallax Effect for Hero Floating Icons
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        const floatingElements = document.querySelectorAll('.animate-float');
        floatingElements.forEach(el => {
            const speed = 25;
            el.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
        });
    });

    // 6. Onboarding Modal Logic
    const onboardingModal = document.getElementById('onboarding-modal');
    const closeBtn = document.getElementById('close-modal');
    const onboardingForm = document.getElementById('onboarding-form');

    // Initialize spots left count
    const savedSpots = localStorage.getItem('getzio_spots');
    if (savedSpots !== null) {
        const spotsEl = document.getElementById('spots-left');
        if (spotsEl) {
            spotsEl.innerText = `Only ${savedSpots} spots left!`;
            // Optional: Hide the line if spots reach 0
            if (parseInt(savedSpots) === 0) spotsEl.innerText = `No spots left!`;
        }
    }

    const hasOnboarded = localStorage.getItem('getzio_onboarded');

    if (onboardingModal && !hasOnboarded) {
        // Show modal after 1.5 seconds with a smooth fade in
        setTimeout(() => {
            onboardingModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 1500);
    }

    const closeModal = () => {
        if (onboardingModal) {
            onboardingModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on clicking outside the card
    if (onboardingModal) {
        onboardingModal.addEventListener('click', (e) => {
            if (e.target === onboardingModal) closeModal();
        });
    }

    if (onboardingForm) {
        onboardingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = onboardingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            // Collect form data
            const formData = {
                name: document.getElementById('name').value,
                storeName: document.getElementById('store-name').value,
                phone: document.getElementById('phone').value,
                interest: document.getElementById('interest').value,
                location: document.getElementById('location').value,
                timestamp: new Date().toISOString()
            };

            // 1. Show Loading State
            submitBtn.disabled = true;
            submitBtn.innerText = '⌛ Sending Interest...';

            try {
                // 2. Send to Getzio Backend API
                const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.');

                const apiUrl = isLocal
                    ? `http://${window.location.hostname}:5000/api/form/submit-interest`
                    : 'https://api.getzio.in/api/form/submit-interest';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    console.log('Interest Registered & Emailed:', formData);

                    // Save to localStorage
                    localStorage.setItem('getzio_onboarded', 'true');

                    // Decrease spots
                    let currentSpots = parseInt(localStorage.getItem('getzio_spots')) || 14;
                    if (currentSpots > 0) {
                        currentSpots--;
                        localStorage.setItem('getzio_spots', currentSpots);
                        const spotsEl = document.getElementById('spots-left');
                        if (spotsEl) spotsEl.innerText = `Only ${currentSpots} spots left!`;
                    }

                    // 3. Show Success State
                    submitBtn.innerText = '✅ Thank You! Redirecting...';
                    submitBtn.classList.remove('bg-getzio');
                    submitBtn.classList.add('bg-green-600');

                    setTimeout(() => {
                        closeModal();
                        // Scroll to partners if they chose vendor/restaurant
                        if (formData.interest === 'vendor' || formData.interest === 'restaurant') {
                            const partnerSection = document.getElementById('partners');
                            if (partnerSection) {
                                const headerOffset = 80;
                                const elementPosition = partnerSection.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                            }
                        }
                    }, 1500);
                } else {
                    throw new Error('Failed to send');
                }
            } catch (error) {
                console.error('Submission Error:', error);
                submitBtn.innerText = '❌ Error. Try Again';
                submitBtn.classList.add('bg-red-500');
                submitBtn.disabled = false;

                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.classList.remove('bg-red-500');
                }, 3000);
            }
        });
    }
});
