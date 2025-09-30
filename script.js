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
});
