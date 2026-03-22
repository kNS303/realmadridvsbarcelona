/**
 * Animations - Contadores animados y animaciones de scroll
 */

/**
 * Anima un contador numérico con easing
 */
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    // easeOutExpo: rápido al inicio, suave al final
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const current = Math.round(start + (target - start) * easedProgress);

        element.textContent = current.toLocaleString('es-ES');

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/**
 * Observer compartido para reutilizar en renders dinámicos
 */
let _scrollObserver = null;

function _animateScrollElement(el) {
    el.classList.add('visible');

    // Animar contadores dentro del elemento visible
    const counters = el.querySelectorAll('[data-counter]');
    counters.forEach((counter, index) => {
        const target = parseInt(counter.dataset.counter, 10);
        setTimeout(() => {
            animateCounter(counter, target);
        }, index * 200);
    });

    // Delay base para barras: respetar el stagger del propio elemento
    const itemDelay = parseInt(el.style.transitionDelay) || 0;

    // Animar barras comparativas estaticas (comp-bar) si las hay
    const bars = el.querySelectorAll('.comp-bar-fill-rm, .comp-bar-fill-fcb');
    bars.forEach(bar => {
        const targetWidth = bar.dataset.width;
        if (targetWidth) {
            setTimeout(() => {
                bar.style.width = targetWidth + '%';
            }, itemDelay + 300);
        }
    });

    // Animar barras del comparador de jugadores
    const comparadorBars = el.querySelectorAll('.comparador-bar-fill-rm, .comparador-bar-fill-fcb');
    comparadorBars.forEach(bar => {
        const targetWidth = bar.dataset.width;
        if (targetWidth) {
            setTimeout(() => {
                bar.style.width = targetWidth + '%';
            }, itemDelay + 300);
        }
    });

    // Animar barras de jugadores
    const playerBars = el.querySelectorAll('.player-bar');
    playerBars.forEach(bar => {
        const targetWidth = bar.dataset.width;
        if (targetWidth) {
            setTimeout(() => {
                bar.style.width = targetWidth + '%';
            }, 500);
        }
    });
}

function _createObserver() {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                _animateScrollElement(entry.target);
                _scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });
}

/**
 * Inicializa las animaciones de scroll con IntersectionObserver
 */
function initScrollAnimations() {
    _scrollObserver = _createObserver();
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        _scrollObserver.observe(el);
    });
}

/**
 * Observa nuevos elementos animate-on-scroll en un contenedor.
 * Llamar después de renders dinámicos (clásico cards, comparador bars).
 * @param {Element} container - Contenedor donde buscar .animate-on-scroll
 */
function observeNewElements(container) {
    if (!_scrollObserver) _scrollObserver = _createObserver();
    const scope = container || document;
    scope.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => {
        _scrollObserver.observe(el);
    });
}

/**
 * Crea las barras CSS comparativas para estadísticas detalladas
 */
function initComparativeBars(statsData) {
    const container = document.getElementById('comparative-bars');
    if (!container) return;

    const labels = statsData.labels;
    const rm = statsData.realMadrid;
    const fcb = statsData.barcelona;

    Object.keys(labels).forEach(key => {
        const rmVal = rm[key];
        const fcbVal = fcb[key];
        const total = rmVal + fcbVal;
        const rmPct = total > 0 ? (rmVal / total) * 100 : 50;
        const fcbPct = total > 0 ? (fcbVal / total) * 100 : 50;

        const displayLabel = (typeof i18n !== 'undefined') ? i18n.t('stats.' + key) : labels[key];
        const item = document.createElement('div');
        item.className = 'comp-bar-item';
        item.innerHTML = `
            <div class="comp-bar-label">${displayLabel}</div>
            <div class="comp-bar-row">
                <span class="comp-bar-value rm-val">${rmVal.toLocaleString('es-ES')}</span>
                <div class="comp-bar-track">
                    <div class="comp-bar-fill-rm" data-width="${rmPct.toFixed(1)}"></div>
                    <div class="comp-bar-fill-fcb" data-width="${fcbPct.toFixed(1)}"></div>
                </div>
                <span class="comp-bar-value fcb-val">${fcbVal.toLocaleString('es-ES')}</span>
            </div>
        `;

        container.appendChild(item);
    });
}