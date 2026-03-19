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
 * Inicializa las animaciones de scroll con IntersectionObserver
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animar contadores dentro del elemento visible
                const counters = entry.target.querySelectorAll('[data-counter]');
                counters.forEach((counter, index) => {
                    const target = parseInt(counter.dataset.counter, 10);
                    // Retraso escalonado para cada contador
                    setTimeout(() => {
                        animateCounter(counter, target);
                    }, index * 200);
                });

                // Animar barras comparativas si las hay
                const bars = entry.target.querySelectorAll('.comp-bar-fill-rm, .comp-bar-fill-fcb');
                bars.forEach(bar => {
                    const targetWidth = bar.dataset.width;
                    if (targetWidth) {
                        setTimeout(() => {
                            bar.style.width = targetWidth + '%';
                        }, 300);
                    }
                });

                // Animar barras de jugadores
                const playerBars = entry.target.querySelectorAll('.player-bar');
                playerBars.forEach(bar => {
                    const targetWidth = bar.dataset.width;
                    if (targetWidth) {
                        setTimeout(() => {
                            bar.style.width = targetWidth + '%';
                        }, 500);
                    }
                });

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
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

        const item = document.createElement('div');
        item.className = 'comp-bar-item';
        item.innerHTML = `
            <div class="comp-bar-label">${labels[key]}</div>
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