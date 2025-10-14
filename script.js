document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA PARA LA BARRA DE NAVEGACIÓN Y MENÚ HAMBURGUESA ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-menu .nav-link");

    // Abrir/cerrar menú hamburguesa al hacer clic
    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
            document.body.classList.toggle("no-scroll"); // Opcional: evita el scroll en móvil
        });

        // Cerrar el menú al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
                document.body.classList.remove("no-scroll");
            });
        });
    }

    // --- LÓGICA PARA LA ANIMACIÓN AL HACER SCROLL ---
    const sectionsToAnimate = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1 // se activa cuando el 10% de la sección es visible
    });

    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });

    // --- DYNAMIC DAY-TO-DAY LOADER (smooth carousel-like navigation) ---
    // If we're on a day page (filename starts with 'dia'), intercept prev/next links
    function isDayPage() {
        return /dia\d+\.html$/.test(window.location.pathname.split('/').pop());
    }

    async function loadDayContent(url, pushState = true) {
        try {
            console.log('loadDayContent start', url);
            const res = await fetch(url, {cache: 'no-store'});
            console.log('fetch status', res.status, res.ok);
            if (!res.ok) throw new Error('Failed to load ' + url);
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const newHero = doc.querySelector('.day-hero');
            const newDetail = doc.querySelector('.day-detail-section');
            const newNav = doc.querySelector('.day-nav');

            if (newHero && newDetail) {
                const oldHero = document.querySelector('.day-hero');
                const oldDetail = document.querySelector('.day-detail-section');

                const oldNav = document.querySelector('.day-nav');

                if (oldHero && oldDetail) {
                    // Import nodes from the fetched document to the current document
                    const importedHero = document.importNode(newHero, true);
                    const importedDetail = document.importNode(newDetail, true);

                    oldHero.replaceWith(importedHero);
                    oldDetail.replaceWith(importedDetail);

                    // If the fetched document includes a .day-nav, replace the current one too
                    if (newNav && oldNav) {
                        const importedNav = document.importNode(newNav, true);
                        oldNav.replaceWith(importedNav);
                    }

                    // Re-observe newly inserted animated sections (inside the imported nodes)
                    const newSections = document.querySelectorAll('.animate-on-scroll');
                    newSections.forEach(s => observer.observe(s));

                    // Reattach Prev/Next handlers for the newly inserted nav
                    console.log('loadDayContent: replaced content for', url);
                    attachDayNavHandlers();

                    if (pushState) {
                        history.pushState({dayUrl: url}, '', url);
                    }
                }
            }
        } catch (err) {
            console.error('Day loader error:', err);
            // fallback to a full navigation if fetch fails
            window.location.href = url;
        }
    }

    function attachDayNavHandlers() {
        const dayNav = document.querySelector('.day-nav');
        if (!dayNav) return;
        const prev = dayNav.querySelector('.prev');
        const next = dayNav.querySelector('.next');
        console.log('attachDayNavHandlers:', {prev: !!prev, next: !!next});

        if (prev) {
            prev.onclick = function(e) {
                const href = prev.getAttribute('href');
                if (href && href.endsWith('.html')) {
                    e.preventDefault();
                    console.log('prev clicked ->', href);
                    loadDayContent(href);
                }
            };
        }

        if (next) {
            next.onclick = function(e) {
                const href = next.getAttribute('href');
                if (href && href.endsWith('.html')) {
                    e.preventDefault();
                    console.log('next clicked ->', href);
                    loadDayContent(href);
                }
            };
        }
    }

    // Attach handlers on first load if on a day page
    if (isDayPage()) attachDayNavHandlers();

    // Handle back/forward navigation
    window.addEventListener('popstate', (ev) => {
        const state = ev.state;
        if (state && state.dayUrl) {
            // load without pushing state
            loadDayContent(state.dayUrl, false);
        }
    });

    // --- Mini Chatbot (simple rule-based) ---
    const chatbotFloat = document.querySelector('.chatbot-float');
    const chatbotPanel = document.getElementById('chatbot-panel');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotMessages = document.getElementById('chatbot-messages');

    function botReply(text) {
        const p = document.createElement('p');
        p.textContent = text;
        p.style.background = '#f1f1f1';
        p.style.padding = '8px';
        p.style.borderRadius = '6px';
        chatbotMessages.appendChild(p);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function userSay(text) {
        const p = document.createElement('p');
        p.textContent = text;
        p.style.textAlign = 'right';
        chatbotMessages.appendChild(p);
    }

    chatbotFloat && chatbotFloat.addEventListener('click', (e) => {
        e.preventDefault();
        if (chatbotPanel.getAttribute('aria-hidden') === 'false') {
            chatbotPanel.setAttribute('aria-hidden', 'true');
        } else {
            chatbotPanel.setAttribute('aria-hidden', 'false');
            botReply('Hi! I can answer simple questions about the tour. Try: "dates", "itinerary", "price", "contact"');
        }
    });

    chatbotClose && chatbotClose.addEventListener('click', () => {
        chatbotPanel.setAttribute('aria-hidden', 'true');
    });

    chatbotForm && chatbotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatbot-input');
        const q = input.value.trim().toLowerCase();
        if (!q) return;
        userSay(input.value.trim());
        input.value = '';

        // Simple rule-based answers
        if (q.includes('date') || q.includes('when')) {
            botReply('Upcoming dates: May 15-22, June 12-19, July 10-17.');
        } else if (q.includes('price') || q.includes('cost')) {
            botReply('Prices depend on season and room choice. Contact us at info@toccaamalfi.com for details.');
        } else if (q.includes('itiner') || q.includes('day')) {
            botReply('The 10-day journey includes Naples, Pompeii, Capri, Positano, Ravello and local experiences. Click any day in the itinerary grid to learn more.');
        } else if (q.includes('contact') || q.includes('email')) {
            botReply('Email: info@toccaamalfi.com — or press the WhatsApp button to message us.');
        } else {
            botReply('Sorry, I can only answer basic questions. Try "dates", "price", "itinerary" or "contact".');
        }
    });

    // --- FALLBACK: ensure Day 9 shows mobile-summary on small screens ---
    function ensureDay9MobileSummary() {
        try {
            var mq = window.matchMedia('(max-width: 920px)');
            var row = document.querySelector('.itinerary-day-row[data-day="9"]');
            if (!row) return;
            var original = row.querySelector('.day-description .original');
            var mobile = row.querySelector('.day-description .mobile-summary');
            if (mq.matches) {
                if (original) original.style.display = 'none';
                if (mobile) mobile.style.display = 'block';
            } else {
                if (original) original.style.display = '';
                if (mobile) mobile.style.display = 'none';
            }
        } catch (e) {
            console.warn('Day9 mobile-summary fallback failed', e);
        }
    }

    // Run on load and on resize/orientation change
    ensureDay9MobileSummary();
    window.addEventListener('resize', ensureDay9MobileSummary);
    window.addEventListener('orientationchange', ensureDay9MobileSummary);

    // --- INTERACTIVE TIMELINE ANIMATIONS ---
    function initTimelineAnimations() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                    }, 100);
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.2
        });

        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });

        // Add click interactions for timeline items
        timelineItems.forEach((item, index) => {
            item.addEventListener('click', function() {
                const dayNumber = index + 1;
                // Optional: Navigate to individual day pages if they exist
                // window.location.href = `dia${dayNumber}.html`;
                
                // For now, just add a subtle feedback animation
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });

            // Add hover sound effect (optional)
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px)';
            });

            item.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }

    // Initialize timeline animations
    initTimelineAnimations();
});
