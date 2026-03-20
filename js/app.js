/**
 * App - Orquestador principal
 * Inicializa datos, gráficos, tablas, animaciones y toggle de modo
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Cargar datos
        const dataService = new DataService();
        const data = await dataService.init();

        // Estado global del modo
        let currentMode = 'history'; // 'history' or 'season'
        const chartInstances = {};
        const loadedSections = new Set();

        // 2. Inicializar navegación
        initNavigation();

        // 3. Crear gráficos con lazy loading (solo cuando son visibles)
        initLazyCharts(dataService, chartInstances, loadedSections, () => currentMode);

        // 4. Crear tablas de jugadores
        buildPlayerTables(dataService, currentMode);

        // 5. Renderizar último partido en el Hero
        renderLastMatch('last-match-rm', dataService.getUltimoPartido('realMadrid'));
        renderLastMatch('last-match-fcb', dataService.getUltimoPartido('barcelona'));

        // 6. Crear barras comparativas CSS
        initComparativeBars(dataService.getEstadisticasByMode(currentMode));

        // 7. Inicializar animaciones de scroll (después de crear todo el DOM)
        initScrollAnimations();

        // 8. Inicializar toggle de modo
        initModeToggle(dataService, chartInstances, loadedSections, {
            getMode: () => currentMode,
            setMode: (m) => { currentMode = m; }
        });

        // 9. Ocultar loading, mostrar contenido
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error('Error inicializando la app:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ff4444; text-align: center;">
                Error cargando los datos.<br>
                <small style="color: #999;">Asegúrate de servir la página desde un servidor local (Live Server, etc.)</small>
            </p>
        `;
    }
});

// ================================================
// Chart creation functions (reusable for toggle)
// ================================================

function createTitulosCharts(dataService, chartInstances, mode) {
    const titulos = dataService.getTitulosByMode(mode);
    chartInstances['titulos-bar'] = ChartFactory.createTitulosBar('chart-titulos-bar', titulos);
    chartInstances['titulos-donut-rm'] = ChartFactory.createTitulosDonut('chart-titulos-donut-rm', titulos.realMadrid, titulos.labels, true);
    chartInstances['titulos-donut-fcb'] = ChartFactory.createTitulosDonut('chart-titulos-donut-fcb', titulos.barcelona, titulos.labels, false);
}

function createHistorialCharts(dataService, chartInstances, mode) {
    const historial = dataService.getHistorialByMode(mode);
    chartInstances['historial-bar'] = ChartFactory.createHistorialBar('chart-historial-bar', historial);
    chartInstances['goles-donut-rm'] = ChartFactory.createGolesDonut('chart-goles-donut-rm', historial.realMadrid, true);
    chartInstances['goles-donut-fcb'] = ChartFactory.createGolesDonut('chart-goles-donut-fcb', historial.barcelona, false);
}

function createClasicoCharts(dataService, chartInstances, mode) {
    const clasico = dataService.getClasicoByMode(mode);
    chartInstances['clasico-donut'] = ChartFactory.createClasicoDonut('chart-clasico-donut', clasico);
    chartInstances['clasico-competicion'] = ChartFactory.createClasicoCompeticion('chart-clasico-competicion', clasico.porCompeticion);
    if (mode === 'history' && clasico.evolucionHistorica && clasico.evolucionHistorica.length > 0) {
        chartInstances['clasico-timeline'] = ChartFactory.createClasicoTimeline('chart-clasico-timeline', clasico.evolucionHistorica);
    }
}

function createEstadisticasCharts(dataService, chartInstances, mode) {
    const stats = dataService.getEstadisticasByMode(mode);
    chartInstances['radar'] = ChartFactory.createRadarChart('chart-radar', stats);
}

// ================================================
// Lazy loading de gráficos
// ================================================

function initLazyCharts(dataService, chartInstances, loadedSections, getMode) {
    const chartConfigs = [
        {
            sectionId: 'titulos',
            create: () => {
                createTitulosCharts(dataService, chartInstances, getMode());
                loadedSections.add('titulos');
            }
        },
        {
            sectionId: 'historial',
            create: () => {
                createHistorialCharts(dataService, chartInstances, getMode());
                loadedSections.add('historial');
            }
        },
        {
            sectionId: 'clasico',
            create: () => {
                createClasicoCharts(dataService, chartInstances, getMode());
                loadedSections.add('clasico');
            }
        },
        {
            sectionId: 'estadisticas',
            create: () => {
                createEstadisticasCharts(dataService, chartInstances, getMode());
                loadedSections.add('estadisticas');
            }
        }
    ];

    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const config = chartConfigs.find(c => c.sectionId === entry.target.id);
                if (config) {
                    setTimeout(() => config.create(), 300);
                }
                chartObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '100px'
    });

    chartConfigs.forEach(config => {
        const section = document.getElementById(config.sectionId);
        if (section) {
            chartObserver.observe(section);
        }
    });
}

// ================================================
// Player tables
// ================================================

function buildPlayerTables(dataService, mode) {
    const jugadores = dataService.getJugadoresByMode(mode);
    createPlayerTable('table-goleadores-rm', jugadores.goleadores.realMadrid, 'goles', 'rm');
    createPlayerTable('table-goleadores-fcb', jugadores.goleadores.barcelona, 'goles', 'fcb');
    createPlayerTable('table-asistentes-rm', jugadores.asistentes.realMadrid, 'asistencias', 'rm');
    createPlayerTable('table-asistentes-fcb', jugadores.asistentes.barcelona, 'asistencias', 'fcb');
}

// ================================================
// Mode Toggle
// ================================================

function initModeToggle(dataService, chartInstances, loadedSections, modeRef) {
    const toggle = document.getElementById('mode-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        const newMode = modeRef.getMode() === 'history' ? 'season' : 'history';
        toggle.setAttribute('aria-checked', newMode === 'season');
        document.getElementById('toggle-label-history').classList.toggle('active', newMode === 'history');
        document.getElementById('toggle-label-season').classList.toggle('active', newMode === 'season');
        switchMode(newMode, dataService, chartInstances, loadedSections, modeRef);
    });

    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle.click();
        }
    });
}

function switchMode(newMode, dataService, chartInstances, loadedSections, modeRef) {
    modeRef.setMode(newMode);

    // Fade out
    const sections = document.querySelectorAll('.dashboard-section, .hero-global-stats');
    sections.forEach(s => s.classList.add('data-transitioning'));

    setTimeout(() => {
        // Update hero
        updateHero(dataService, newMode);

        // Update counters
        updateTituloCounters(dataService, newMode);
        updateHistorialCounters(dataService, newMode);
        updateClasicoCounters(dataService, newMode);

        // Recreate charts (only already-loaded sections)
        recreateCharts(dataService, chartInstances, loadedSections, newMode);

        // Rebuild comparative bars
        const barsContainer = document.getElementById('comparative-bars');
        if (barsContainer) {
            barsContainer.innerHTML = '';
            initComparativeBars(dataService.getEstadisticasByMode(newMode));
        }

        // Rebuild player tables
        buildPlayerTables(dataService, newMode);

        // Update section texts
        updateSectionTexts(newMode);

        // Show/hide mode-specific elements
        document.querySelectorAll('[data-mode-hide]').forEach(el => {
            el.style.display = el.dataset.modeHide === newMode ? 'none' : '';
        });

        // Fade in
        requestAnimationFrame(() => {
            sections.forEach(s => s.classList.remove('data-transitioning'));
        });
    }, 280);
}

function updateHero(dataService, mode) {
    const heroStats = dataService.getHeroStatsByMode(mode);

    const counterEls = document.querySelectorAll('.hero-stat-number[data-counter]');
    if (counterEls[0]) {
        counterEls[0].dataset.counter = heroStats.clasicosDisputados;
        animateCounter(counterEls[0], heroStats.clasicosDisputados, 1200);
    }
    if (counterEls[1]) {
        counterEls[1].dataset.counter = heroStats.golesEnClasicos;
        animateCounter(counterEls[1], heroStats.golesEnClasicos, 1200);
    }

    const label0 = document.getElementById('hero-stat-label-0');
    const label1 = document.getElementById('hero-stat-label-1');
    if (label0) label0.textContent = mode === 'season' ? 'Clásicos esta temporada' : 'Clásicos disputados';
    if (label1) label1.textContent = mode === 'season' ? 'Goles en clásicos esta temporada' : 'Goles en clásicos';

    const subtitle = document.getElementById('hero-subtitle');
    if (subtitle) subtitle.textContent = heroStats.subtitulo;
}

function updateTituloCounters(dataService, mode) {
    const rmTotal = dataService.getTotalTitulosByMode('realMadrid', mode);
    const fcbTotal = dataService.getTotalTitulosByMode('barcelona', mode);

    const rmEl = document.getElementById('rm-total-titulos');
    const fcbEl = document.getElementById('fcb-total-titulos');

    if (rmEl) {
        rmEl.dataset.counter = rmTotal;
        animateCounter(rmEl, rmTotal, 1200);
    }
    if (fcbEl) {
        fcbEl.dataset.counter = fcbTotal;
        animateCounter(fcbEl, fcbTotal, 1200);
    }
}

function updateHistorialCounters(dataService, mode) {
    const historial = dataService.getHistorialByMode(mode);
    const grid = document.querySelector('#historial .counter-grid-4');
    if (!grid) return;

    const counters = grid.querySelectorAll('.counter-number');
    const values = [
        historial.realMadrid.partidosJugados,
        historial.realMadrid.golesAFavor,
        historial.barcelona.partidosJugados,
        historial.barcelona.golesAFavor
    ];

    counters.forEach((el, i) => {
        if (values[i] !== undefined) {
            el.dataset.counter = values[i];
            animateCounter(el, values[i], 1200);
        }
    });
}

function updateClasicoCounters(dataService, mode) {
    const clasico = dataService.getClasicoByMode(mode);
    const grid = document.querySelector('#clasico .counter-grid');
    if (!grid) return;

    const counters = grid.querySelectorAll('.counter-number');
    const values = [clasico.victoriasRealMadrid, clasico.empates, clasico.victoriasBarcelona];

    counters.forEach((el, i) => {
        if (values[i] !== undefined) {
            el.dataset.counter = values[i];
            animateCounter(el, values[i], 1200);
        }
    });
}

function destroyCharts(chartInstances, keys) {
    keys.forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            delete chartInstances[key];
        }
    });
}

function recreateCharts(dataService, chartInstances, loadedSections, mode) {
    if (loadedSections.has('titulos')) {
        destroyCharts(chartInstances, ['titulos-bar', 'titulos-donut-rm', 'titulos-donut-fcb']);
        createTitulosCharts(dataService, chartInstances, mode);
    }
    if (loadedSections.has('historial')) {
        destroyCharts(chartInstances, ['historial-bar', 'goles-donut-rm', 'goles-donut-fcb']);
        createHistorialCharts(dataService, chartInstances, mode);
    }
    if (loadedSections.has('clasico')) {
        destroyCharts(chartInstances, ['clasico-donut', 'clasico-competicion', 'clasico-timeline']);
        createClasicoCharts(dataService, chartInstances, mode);
    }
    if (loadedSections.has('estadisticas')) {
        destroyCharts(chartInstances, ['radar']);
        createEstadisticasCharts(dataService, chartInstances, mode);
    }
}

function updateSectionTexts(mode) {
    const texts = {
        'historial-subtitle': mode === 'season'
            ? 'Rendimiento en todas las competiciones de la temporada 2025-26'
            : 'Rendimiento histórico en todas las competiciones',
        'clasico-subtitle': mode === 'season'
            ? 'Enfrentamientos directos en la temporada 2025-26'
            : 'Enfrentamientos directos a lo largo de la historia',
        'jugadores-title': mode === 'season'
            ? 'Jugadores Destacados'
            : 'Leyendas del Club',
        'jugadores-subtitle': mode === 'season'
            ? 'Máximos goleadores y asistentes de la temporada 2025-26'
            : 'Máximos goleadores y asistentes de la historia',
        'goleadores-subtitle': mode === 'season'
            ? 'Máximos Goleadores de la Temporada'
            : 'Máximos Goleadores',
        'asistentes-subtitle': mode === 'season'
            ? 'Máximos Asistentes de la Temporada'
            : 'Máximos Asistentes'
    };

    Object.entries(texts).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
}

// ================================================
// Navegación
// ================================================

function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const links = navLinks.querySelectorAll('a');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    const sections = document.querySelectorAll('.dashboard-section');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-60px 0px -40% 0px'
    });

    sections.forEach(section => sectionObserver.observe(section));

    window.addEventListener('scroll', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    }, { passive: true });

    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 15, 0.85)';
        }
    }, { passive: true });
}

// ================================================
// Último partido
// ================================================

function renderLastMatch(containerId, matchData) {
    const container = document.getElementById(containerId);
    if (!container || !matchData) return;

    const { rival, golesLocal, golesVisitante, esLocal, competicion, resultado } = matchData;

    const resultClasses = {
        'victoria': 'result-win',
        'empate': 'result-draw',
        'derrota': 'result-loss'
    };

    const resultLabels = {
        'victoria': 'Victoria',
        'empate': 'Empate',
        'derrota': 'Derrota'
    };

    const score = esLocal
        ? `${golesLocal} - ${golesVisitante}`
        : `${golesVisitante} - ${golesLocal}`;

    const cssClass = resultClasses[resultado] || 'result-draw';
    const label = resultLabels[resultado] || resultado;
    const compLabel = competicion ? `<span class="match-competition">${competicion}</span>` : '';

    container.innerHTML = `
        <span class="match-opponent">vs ${rival}</span>
        ${compLabel}
        <span class="match-score">${score}</span>
        <span class="match-result ${cssClass}">${label}</span>
    `;
}
