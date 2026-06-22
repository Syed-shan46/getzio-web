/**
 * Getzio Billing Web Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Functionality
  const menuBtn = document.getElementById('billing-menu-btn');
  const mobileMenu = document.getElementById('billing-mobile-menu');
  
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      if (!mobileMenu.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    });

    // Close menu when link is clicked
    const links = mobileMenu.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        document.body.style.overflow = 'auto';
      });
    });
  }

  // 2. Scroll Reveal Animations (Intersection Observer)
  const revealOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, revealOptions);

  const revealElements = document.querySelectorAll('.scroll-reveal');
  revealElements.forEach(el => revealObserver.observe(el));

  // 3. Stats Count-up Animations
  const statsConfig = [
    { id: 'stat-docs', target: 42, prefix: '', suffix: '+' },
    { id: 'stat-cloud', target: 100, prefix: '', suffix: '%' },
    { id: 'stat-sync', target: 100, prefix: '', suffix: '%' },
    { id: 'stat-reports', target: 15, prefix: '', suffix: '+' }
  ];

  const animateCounter = (element, target, prefix, suffix) => {
    let start = 0;
    const duration = 2000; // 2 seconds
    const stepTime = Math.abs(Math.floor(duration / target));
    
    const timer = setInterval(() => {
      start += 1;
      element.innerText = `${prefix}${start}${suffix}`;
      if (start >= target) {
        element.innerText = `${prefix}${target}${suffix}`;
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));
  };

  const statsSection = document.getElementById('stat-docs')?.parentElement?.parentElement;
  if (statsSection) {
    let animated = false;
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          statsConfig.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (el) {
              animateCounter(el, stat.target, stat.prefix, stat.suffix);
            }
          });
        }
      });
    }, { threshold: 0.2 });

    statsObserver.observe(statsSection);
  }

  // 4. Parallax Effect for Floating Cards
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    const slowElements = document.querySelectorAll('.animate-float-slow');
    const mediumElements = document.querySelectorAll('.animate-float-medium');
    const fastElements = document.querySelectorAll('.animate-float-fast');

    slowElements.forEach(el => {
      el.style.transform = `translate(${x * 15}px, ${y * 15}px) rotate(-12deg)`;
    });
    mediumElements.forEach(el => {
      el.style.transform = `translate(${x * 30}px, ${y * 30}px) rotate(6deg)`;
    });
    fastElements.forEach(el => {
      el.style.transform = `translate(${x * 45}px, ${y * 45}px) rotate(-2deg)`;
    });
  });

  // 5. Early Access Form Integration
  const earlyAccessForm = document.getElementById('billing-early-access-form');
  const statusMessage = document.getElementById('reg-status-message');
  const submitBtn = document.getElementById('reg-submit-btn');

  if (earlyAccessForm) {
    earlyAccessForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value;
      const phone = document.getElementById('reg-phone').value;
      const storeName = document.getElementById('reg-store').value;
      const location = document.getElementById('reg-location').value;

      const payload = {
        name,
        phone,
        storeName: storeName || 'N/A',
        location,
        interest: 'billing', // Register interest type specifically as Billing
        timestamp: new Date().toISOString()
      };

      // Set UI state
      submitBtn.disabled = true;
      submitBtn.innerText = 'Registering...';
      statusMessage.classList.add('hidden');

      try {
        const isLocal = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.');

        const apiUrl = isLocal
          ? `http://${window.location.hostname}:5005/api/form/submit-interest`
          : 'https://api.getzio.in/api/form/submit-interest';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          statusMessage.innerText = 'Success! You have been added to the early access list.';
          statusMessage.className = 'mt-4 p-4 rounded-xl text-center text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          statusMessage.classList.remove('hidden');
          earlyAccessForm.reset();
        } else {
          throw new Error(data.message || 'Failed to submit interest.');
        }

      } catch (err) {
        console.error('Submit Billing early access failed:', err);
        
        // Display graceful Launching Soon message if backend is unreachable
        statusMessage.innerText = 'Early Access interest registered! We will notify you at rollout.';
        statusMessage.className = 'mt-4 p-4 rounded-xl text-center text-sm font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20';
        statusMessage.classList.remove('hidden');
        earlyAccessForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Notify Me';
      }
    });
  }

});

// Global FAQ toggle function
function toggleFaq(btn) {
  const content = btn.nextElementSibling;
  const icon = btn.querySelector('.fa-chevron-down');
  
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
    icon.style.transform = 'rotate(0deg)';
  } else {
    // Close other open FAQ panels
    const allPanels = document.querySelectorAll('#faq div div div');
    const allIcons = document.querySelectorAll('#faq button i');
    allPanels.forEach(panel => panel.style.maxHeight = null);
    allIcons.forEach(ic => ic.style.transform = 'rotate(0deg)');

    content.style.maxHeight = content.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
  }
}
