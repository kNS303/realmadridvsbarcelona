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

        // 2. Mostrar fecha de última actualización en el nav
        if (data.meta?.lastUpdated) {
            const navUpdatedText = document.getElementById('nav-updated-text');
            if (navUpdatedText) {
                const fecha = new Date(data.meta.lastUpdated + 'T00:00:00');
                const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
                let texto = fecha.toLocaleDateString('es-ES', opciones);
                if (data.meta.lastUpdatedTime) {
                    texto += ` · ${data.meta.lastUpdatedTime}h`;
                }
                navUpdatedText.textContent = texto;
            }
        }

        // 3. Inicializar navegación
        initNavigation();

        // 4. Crear gráficos con lazy loading (solo cuando son visibles)
        initLazyCharts(dataService, chartInstances, loadedSections, () => currentMode);

        // 5. Crear tablas de jugadores
        buildPlayerTables(dataService, currentMode);

        // 6. Renderizar último partido en el Hero
        renderLastMatch('last-match-rm', dataService.getUltimoPartido('realMadrid'));
        renderLastMatch('last-match-fcb', dataService.getUltimoPartido('barcelona'));

        // 6b. Renderizar próximo partido y próximo Clásico
        renderNextMatch('next-match-rm', dataService.getProximoPartido('realMadrid'));
        renderNextMatch('next-match-fcb', dataService.getProximoPartido('barcelona'));
        renderProximoClasico(dataService.getProximoClasico());

        // 6c. Renderizar forma reciente
        renderFormaReciente('forma-reciente-rm', dataService.getFormaReciente('realMadrid'));
        renderFormaReciente('forma-reciente-fcb', dataService.getFormaReciente('barcelona'));

        // 6d. Renderizar clasificación La Liga (oculta inicialmente en modo history)
        renderStandings(dataService);

        // 6d. Renderizar estadisticas h2h y tarjetas de últimos Clásicos
        renderH2HStats(dataService);
        renderClasicosCards(dataService, currentMode);

        // 6f. Inicializar comparador de jugadores
        initComparador(dataService, currentMode);

        // 6e. Aplicar visibilidad inicial segun modo
        document.querySelectorAll('[data-mode-hide]').forEach(el => {
            el.style.display = el.dataset.modeHide === currentMode ? 'none' : '';
        });

        // 7. Crear barras comparativas CSS
        initComparativeBars(dataService.getEstadisticasByMode(currentMode));

        // 8. Inicializar animaciones de scroll (después de crear todo el DOM)
        initScrollAnimations();

        // 9. Inicializar toggle de modo
        initModeToggle(dataService, chartInstances, loadedSections, {
            getMode: () => currentMode,
            setMode: (m) => { currentMode = m; }
        });

        // 10. Banner campeon (solo en modo temporada actual)
        renderTitulosBanner(dataService, currentMode);

        // 9. Ocultar loading, mostrar contenido
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error('Error inicializando la app:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ff453a; text-align: center;">
                Error cargando los datos.<br>
                <small style="color: #8e8e93;">Asegúrate de servir la página desde un servidor local (Live Server, etc.)</small>
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

        // Rebuild Clasicos cards
        renderClasicosCards(dataService, newMode);

        // Rebuild comparador
        initComparador(dataService, newMode);

        // Update section texts
        updateSectionTexts(newMode);

        // Update campeon banner
        renderTitulosBanner(dataService, newMode);

        // Show/hide mode-specific elements
        document.querySelectorAll('[data-mode-hide]').forEach(el => {
            el.style.display = el.dataset.modeHide === newMode ? 'none' : '';
        });

        // Fade in
        requestAnimationFrame(() => {
            sections.forEach(s => s.classList.remove('data-transitioning'));
        });

        // Apply bar widths after DOM settles (observer already fired and unobserved)
        setTimeout(() => {
            document.querySelectorAll('.comp-bar-fill-rm, .comp-bar-fill-fcb').forEach(bar => {
                const w = bar.dataset.width;
                if (w) bar.style.width = w + '%';
            });
            document.querySelectorAll('.player-bar').forEach(bar => {
                const w = bar.dataset.width;
                if (w) bar.style.width = w + '%';
            });
        }, 100);
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
            : 'Máximos Asistentes',
        'ultimos-clasicos-title': mode === 'season'
            ? 'Clasicos de la Temporada'
            : 'Ultimos Clasicos'
    };

    Object.entries(texts).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
}

// ================================================
// Campeon Banner + Confetti
// ================================================

function renderTitulosBanner(dataService, mode) {
    const existing = document.getElementById('titulos-campeon-banners');
    if (existing) existing.remove();

    if (mode !== 'season') return;

    const titulos = dataService.getTitulosByMode('season');
    const labels = titulos.labels || {};

    const equipos = [
        { key: 'realMadrid', nombre: 'Real Madrid', cssClass: 'rm-banner' },
        { key: 'barcelona', nombre: 'FC Barcelona', cssClass: 'fcb-banner' }
    ];

    const banners = [];

    for (const equipo of equipos) {
        const equipoTitulos = titulos[equipo.key];
        if (!equipoTitulos) continue;
        for (const [comp, valor] of Object.entries(equipoTitulos)) {
            if (valor > 0) {
                const label = labels[comp] || comp;
                banners.push({ equipo, label });
            }
        }
    }

    if (banners.length === 0) return;

    const titulosSection = document.getElementById('titulos');
    if (!titulosSection) return;
    const sectionContainer = titulosSection.querySelector('.section-container');
    if (!sectionContainer) return;

    const container = document.createElement('div');
    container.id = 'titulos-campeon-banners';

    banners.forEach(({ equipo, label }, i) => {
        const div = document.createElement('div');
        div.className = `campeon-banner ${equipo.cssClass}`;
        div.style.animationDelay = `${i * 0.15}s`;
        div.textContent = `Campeon de ${label} 2025-26 \u00b7 ${equipo.nombre}`;
        container.appendChild(div);
    });

    const subtitle = sectionContainer.querySelector('.section-subtitle');
    if (subtitle) {
        subtitle.after(container);
    } else {
        sectionContainer.prepend(container);
    }

    if (!window._confettiLaunched) {
        window._confettiLaunched = true;
        launchConfetti(banners);
    }
}

function launchConfetti(banners) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colorsRM = ['#D4A012', '#f0c040', '#c8981a'];
    const colorsFCB = ['#9B1B4D', '#c4326a', '#7a1540'];

    const colors = banners.flatMap(b =>
        b.equipo.key === 'realMadrid' ? colorsRM : colorsFCB
    );

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 70; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';

        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = (Math.random() * 1.2).toFixed(2);
        const duration = (2 + Math.random() * 1).toFixed(2);
        const size = 4 + Math.floor(Math.random() * 6);
        const isSquare = Math.random() > 0.5;

        particle.style.cssText = [
            `left:${left}%`,
            `background:${color}`,
            `width:${size}px`,
            `height:${size}px`,
            `border-radius:${isSquare ? '2px' : '50%'}`,
            `--fall-duration:${duration}s`,
            `--fall-delay:${delay}s`
        ].join(';');

        container.appendChild(particle);
    }

    setTimeout(() => container.remove(), 3500);
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

    // Highlight nav based on scroll position using getBoundingClientRect
    const sections = Array.from(document.querySelectorAll('.dashboard-section'));

    function updateActiveNav() {
        const trigger = 150; // pixels from top of viewport

        // Find the last section whose top has passed the trigger point
        let activeId = null;
        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= trigger) {
                activeId = section.id;
            }
        }

        links.forEach(link => {
            link.classList.toggle('active', activeId !== null && link.getAttribute('href') === `#${activeId}`);
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    window.addEventListener('scroll', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    }, { passive: true });

    const nav = document.getElementById('main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(12, 12, 14, 0.95)';
        } else {
            nav.style.background = 'rgba(12, 12, 14, 0.85)';
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

function renderNextMatch(containerId, matchData) {
    const container = document.getElementById(containerId);
    if (!container || !matchData) return;

    const { rival, fecha, competicion } = matchData;

    container.innerHTML = `
        <span class="next-match-label">Proximo partido</span>
        <span class="next-match-opponent">vs ${rival}</span>
        <span class="next-match-info">${fecha} · ${competicion}</span>
    `;
}

function renderFormaReciente(containerId, forma) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!forma || forma.length === 0) {
        container.innerHTML = '';
        return;
    }

    const claseMap = { 'V': 'forma-v', 'E': 'forma-e', 'D': 'forma-d' };

    container.innerHTML = forma.map(r =>
        `<span class="forma-circulo ${claseMap[r] || 'forma-e'}">${r}</span>`
    ).join('');
}

function renderProximoClasico(clasicoData) {
    const container = document.getElementById('proximo-clasico');
    if (!container) return;

    if (!clasicoData) {
        container.classList.add('hidden');
        return;
    }

    document.getElementById('proximo-clasico-fecha').textContent = clasicoData.fecha;
    document.getElementById('proximo-clasico-comp').textContent = clasicoData.competicion;
    document.getElementById('proximo-clasico-sede').textContent = clasicoData.sede;
    container.classList.remove('hidden');
}

// ================================================
// Clasificacion La Liga
// ================================================

function renderStandings(dataService) {
    const tbody = document.getElementById('standings-tbody');
    if (!tbody) return;

    const standings = dataService.getStandings();
    if (!standings) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:1rem;">Sin datos de clasificacion</td></tr>';
        return;
    }

    const teams = [
        { key: 'realMadrid', data: standings.realMadrid, name: 'Real Madrid', logo: 'assets/madrid-logo.svg', rowClass: 'standings-row-rm' },
        { key: 'barcelona', data: standings.barcelona, name: 'FC Barcelona', logo: 'assets/barca-logo.svg', rowClass: 'standings-row-fcb' }
    ];

    // Sort by position
    teams.sort((a, b) => a.data.position - b.data.position);

    tbody.innerHTML = teams.map(team => {
        const d = team.data;
        const gdSign = d.goalDifference > 0 ? '+' : '';
        const gdClass = d.goalDifference > 0 ? 'st-gd-positive' : '';
        return `
            <tr class="${team.rowClass}">
                <td class="st-pos-cell">${d.position}</td>
                <td class="st-team-cell">
                    <img src="${team.logo}" alt="">
                    ${team.name}
                </td>
                <td class="st-pts-cell">${d.points}</td>
                <td>${d.playedGames}</td>
                <td>${d.won}</td>
                <td>${d.draw}</td>
                <td>${d.lost}</td>
                <td>${d.goalsFor}</td>
                <td>${d.goalsAgainst}</td>
                <td class="st-gd-cell ${gdClass}">${gdSign}${d.goalDifference}</td>
            </tr>
        `;
    }).join('');
}

// ================================================
// Ultimos Clasicos Cards
// ================================================

// ================================================
// Comparador de Jugadores
// ================================================

function initComparador(dataService, mode) {
    const selectRM = document.getElementById('comparador-select-rm');
    const selectFCB = document.getElementById('comparador-select-fcb');
    if (!selectRM || !selectFCB) return;

    const jugadores = dataService.getJugadoresByMode(mode);

    // Build unified player lists per team (merge goleadores + asistentes, no duplicates)
    const rmPlayers = buildPlayerList(jugadores, 'realMadrid');
    const fcbPlayers = buildPlayerList(jugadores, 'barcelona');

    // Populate selects
    populateComparadorSelect(selectRM, rmPlayers);
    populateComparadorSelect(selectFCB, fcbPlayers);

    // Render default (first of each)
    renderComparadorMatch(rmPlayers, fcbPlayers);

    // Remove old listeners by cloning
    const newSelectRM = selectRM.cloneNode(true);
    const newSelectFCB = selectFCB.cloneNode(true);
    selectRM.parentNode.replaceChild(newSelectRM, selectRM);
    selectFCB.parentNode.replaceChild(newSelectFCB, selectFCB);

    newSelectRM.addEventListener('change', () => renderComparadorMatch(rmPlayers, fcbPlayers));
    newSelectFCB.addEventListener('change', () => renderComparadorMatch(rmPlayers, fcbPlayers));
}

function buildPlayerList(jugadores, team) {
    const map = {};
    // Add goleadores (preserve null for unknown assists)
    (jugadores.goleadores[team] || []).forEach(p => {
        map[p.nombre] = {
            nombre: p.nombre,
            goles: p.goles || 0,
            asistencias: p.asistencias === null ? null : (p.asistencias || 0),
            partidos: p.partidos || 0,
            periodo: p.periodo || ''
        };
    });
    // Merge asistentes
    (jugadores.asistentes[team] || []).forEach(p => {
        if (map[p.nombre]) {
            if (p.asistencias != null) map[p.nombre].asistencias = p.asistencias;
            if (p.goles && p.goles > map[p.nombre].goles) map[p.nombre].goles = p.goles;
            if (p.partidos > map[p.nombre].partidos) map[p.nombre].partidos = p.partidos;
        } else {
            map[p.nombre] = {
                nombre: p.nombre,
                goles: p.goles || 0,
                asistencias: p.asistencias === null ? null : (p.asistencias || 0),
                partidos: p.partidos || 0,
                periodo: p.periodo || ''
            };
        }
    });
    // Sort by goals desc, then assists desc (null assists treated as 0 for sorting)
    return Object.values(map).sort((a, b) => (b.goles + (b.asistencias || 0)) - (a.goles + (a.asistencias || 0)));
}

function populateComparadorSelect(select, players) {
    select.innerHTML = players.map((p, i) => {
        return `<option value="${i}">${p.nombre}</option>`;
    }).join('');
}

function renderComparadorMatch(rmPlayers, fcbPlayers) {
    const selectRM = document.getElementById('comparador-select-rm');
    const selectFCB = document.getElementById('comparador-select-fcb');
    if (!selectRM || !selectFCB) return;

    const rmIdx = parseInt(selectRM.value) || 0;
    const fcbIdx = parseInt(selectFCB.value) || 0;
    const rmPlayer = rmPlayers[rmIdx];
    const fcbPlayer = fcbPlayers[fcbIdx];

    if (!rmPlayer || !fcbPlayer) return;

    // Render avatars
    const avatarRM = document.getElementById('comparador-avatar-rm');
    const avatarFCB = document.getElementById('comparador-avatar-fcb');
    // Jugador chutando - replica exacta del icono flaticon lineal color
    const playerKickSvg = (shirt, shirt2, shorts, socks, sockStripe, boot, skin, hair, stripes, facing) => {
        const fl = facing === 'left';
        const o = '#1a1a1a';
        const sw = 4;
        const stripesMarkup = stripes ? `
            <line x1="80" y1="48" x2="76" y2="98" stroke="${shirt2}" stroke-width="6"/>
            <line x1="92" y1="45" x2="90" y2="98" stroke="${shirt2}" stroke-width="6"/>
            <line x1="104" y1="48" x2="104" y2="95" stroke="${shirt2}" stroke-width="5"/>` : '';
        return `<svg viewBox="5 0 200 205" xmlns="http://www.w3.org/2000/svg" style="${fl ? 'transform:scaleX(-1)' : ''}">
          <!-- === CAPA TRASERA === -->
          <!-- Pierna trasera (apoyo, extendida atras-abajo) -->
          <polygon points="82,112 74,118 56,148 44,172 52,176 60,174 64,152 76,124 88,116" fill="${skin}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Media trasera -->
          <polygon points="56,148 44,172 52,176 60,174 64,152" fill="${socks}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Rayas media trasera -->
          <line x1="54" y1="156" x2="62" y2="154" stroke="${sockStripe}" stroke-width="2.5"/>
          <line x1="52" y1="162" x2="60" y2="160" stroke="${sockStripe}" stroke-width="2.5"/>
          <line x1="50" y1="168" x2="58" y2="166" stroke="${sockStripe}" stroke-width="2.5"/>
          <!-- Bota trasera -->
          <polygon points="44,172 36,178 32,184 54,186 60,174 52,176" fill="${boot}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>

          <!-- Brazo trasero (puno arriba-atras) -->
          <polygon points="66,62 60,56 44,40 36,30 30,34 38,44 52,58 62,68" fill="${skin}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Puno trasero -->
          <rect x="24" y="24" width="16" height="14" rx="5" fill="${skin}" stroke="${o}" stroke-width="${sw}" transform="rotate(-40 32 31)"/>

          <!-- === CUERPO === -->
          <!-- Pantalon -->
          <polygon points="70,96 68,104 72,120 88,124 102,124 108,120 112,104 110,96" fill="${shorts}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>

          <!-- Camiseta torso -->
          <polygon points="68,44 54,48 40,54 48,78 66,72 68,98 112,98 114,72 132,78 140,54 126,48 112,44" fill="${shirt}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          ${stripesMarkup}
          <!-- Cuello redondo -->
          <path d="M76,44 Q90,56 104,44" fill="none" stroke="${o}" stroke-width="${sw}" stroke-linecap="round"/>

          <!-- === CAPA DELANTERA === -->
          <!-- Pierna delantera (chutando hacia delante) -->
          <polygon points="96,112 104,118 124,132 144,136 152,124 148,120 132,126 112,114 100,108" fill="${skin}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Media delantera -->
          <polygon points="132,126 144,136 152,124 148,120 140,122" fill="${socks}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Rayas media delantera -->
          <line x1="136" y1="126" x2="146" y2="124" stroke="${sockStripe}" stroke-width="2.5"/>
          <line x1="138" y1="130" x2="148" y2="128" stroke="${sockStripe}" stroke-width="2.5"/>
          <!-- Bota delantera -->
          <polygon points="148,120 160,114 168,118 166,128 152,132 144,136 152,124" fill="${boot}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>

          <!-- Balon -->
          <circle cx="176" cy="122" r="15" fill="#e8e8e8" stroke="${o}" stroke-width="${sw}"/>
          <!-- Pentagono del balon -->
          <polygon points="176,113 183,118 180,126 172,126 169,118" fill="none" stroke="${o}" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Costuras del balon -->
          <line x1="176" y1="113" x2="176" y2="107" stroke="${o}" stroke-width="2"/>
          <line x1="183" y1="118" x2="189" y2="114" stroke="${o}" stroke-width="2"/>
          <line x1="180" y1="126" x2="186" y2="131" stroke="${o}" stroke-width="2"/>
          <line x1="172" y1="126" x2="166" y2="131" stroke="${o}" stroke-width="2"/>
          <line x1="169" y1="118" x2="163" y2="114" stroke="${o}" stroke-width="2"/>

          <!-- Brazo delantero (extendido al frente horizontal) -->
          <polygon points="114,62 120,56 140,46 156,38 158,44 142,52 124,62 116,68" fill="${skin}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Mano delantera abierta -->
          <polygon points="156,38 158,44 164,42 166,36 160,34" fill="${skin}" stroke="${o}" stroke-width="3" stroke-linejoin="round"/>

          <!-- Cabeza -->
          <ellipse cx="90" cy="26" rx="18" ry="20" fill="${skin}" stroke="${o}" stroke-width="${sw}"/>
          <!-- Pelo -->
          <path d="M72,22 Q74,4 90,2 Q106,4 108,22 Q104,12 90,10 Q76,12 72,22 Z" fill="${hair}" stroke="${o}" stroke-width="${sw}" stroke-linejoin="round"/>
          <!-- Oreja -->
          <ellipse cx="73" cy="28" rx="4" ry="6" fill="${skin}" stroke="${o}" stroke-width="2.5"/>
          <!-- Ojo -->
          <ellipse cx="98" cy="23" rx="3" ry="3" fill="${o}"/>
          <!-- Boca -->
          <path d="M96,34 Q99,37 103,34" fill="none" stroke="${o}" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`;
    };
    if (avatarRM) {
        // RM 25-26: camiseta blanca, pantalon blanco, medias blancas, botas negras, rayas negras en hombros
        avatarRM.innerHTML = playerKickSvg('#e8e8ec', null, '#e8e8ec', '#e8e8ec', '#1a1a1a', '#2a2a2a', '#c8956c', '#2a1a0a', false, 'right');
    }
    if (avatarFCB) {
        // FCB 25-26: camiseta blaugrana (azul+granate), pantalon azul oscuro, medias azules, botas oscuras
        avatarFCB.innerHTML = playerKickSvg('#1a3a6b', '#A1224A', '#1a3a6b', '#1a3a6b', '#A1224A', '#1a1a1a', '#c8956c', '#2a1a0a', true, 'left');
    }

    // Render info
    const infoRM = document.getElementById('comparador-info-rm');
    const infoFCB = document.getElementById('comparador-info-fcb');
    if (infoRM) {
        infoRM.innerHTML = `
            <div class="comparador-player-name">${rmPlayer.nombre}</div>
            <div class="comparador-player-period">${rmPlayer.periodo}</div>
        `;
    }
    if (infoFCB) {
        infoFCB.innerHTML = `
            <div class="comparador-player-name">${fcbPlayer.nombre}</div>
            <div class="comparador-player-period">${fcbPlayer.periodo}</div>
        `;
    }

    // Render comparison bars
    const barsContainer = document.getElementById('comparador-bars');
    if (!barsContainer) return;

    const stats = [
        { label: 'Goles', rmVal: rmPlayer.goles, fcbVal: fcbPlayer.goles },
        { label: 'Asistencias', rmVal: rmPlayer.asistencias, fcbVal: fcbPlayer.asistencias },
        { label: 'Partidos', rmVal: rmPlayer.partidos, fcbVal: fcbPlayer.partidos }
    ];

    barsContainer.innerHTML = stats.map((s, index) => {
        const rmNull = s.rmVal === null;
        const fcbNull = s.fcbVal === null;
        const rmNum = rmNull ? 0 : s.rmVal;
        const fcbNum = fcbNull ? 0 : s.fcbVal;
        const total = rmNum + fcbNum;
        const rmPct = total > 0 ? (rmNum / total) * 100 : 50;
        const fcbPct = total > 0 ? (fcbNum / total) * 100 : 50;
        const rmDisplay = rmNull ? 'N/D' : rmNum.toLocaleString('es-ES');
        const fcbDisplay = fcbNull ? 'N/D' : fcbNum.toLocaleString('es-ES');
        const noData = rmNull && fcbNull;
        const staggerDelay = index * 120;
        return `
            <div class="comparador-bar-item animate-on-scroll" style="transition-delay:${staggerDelay}ms">
                <div class="comparador-bar-label">${s.label}</div>
                <div class="comparador-bar-row">
                    <span class="comparador-bar-value rm-val ${rmNull ? 'val-nd' : ''}">${rmDisplay}</span>
                    <div class="comparador-bar-track">
                        ${noData ? '<div class="comparador-bar-nd">Sin registros historicos</div>' : `
                        <div class="comparador-bar-fill-rm" data-width="${rmPct.toFixed(1)}"></div>
                        <div class="comparador-bar-fill-fcb" data-width="${fcbPct.toFixed(1)}"></div>`}
                    </div>
                    <span class="comparador-bar-value fcb-val ${fcbNull ? 'val-nd' : ''}">${fcbDisplay}</span>
                </div>
            </div>
        `;
    }).join('');

    // Observar los nuevos items para animacion de entrada (barras incluidas)
    if (typeof observeNewElements === 'function') {
        observeNewElements(barsContainer);
    }
}

function renderClasicosCards(dataService, mode) {
    const container = document.getElementById('clasicos-cards');
    if (!container) return;

    const partidos = dataService.getUltimosClasicos(mode);

    if (!partidos || partidos.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:0.85rem;">No hay clasicos disputados en este periodo</p>';
        return;
    }

    container.innerHTML = partidos.map((p, index) => {
        const winnerClass = p.ganador === 'rm' ? 'winner-rm' : p.ganador === 'fcb' ? 'winner-fcb' : 'winner-empate';
        const staggerDelay = index * 100;

        return `
            <div class="clasico-card ${winnerClass} animate-on-scroll" style="transition-delay:${staggerDelay}ms">
                <div class="clasico-card-header">
                    <span class="clasico-card-date">${p.fecha}</span>
                    <span class="clasico-card-comp">${p.competicion}</span>
                </div>
                <div class="clasico-card-score">
                    <span class="clasico-card-team"><img src="https://crests.football-data.org/86.png" alt="RM" class="clasico-score-crest"/></span>
                    <span class="clasico-card-goals">
                        <span class="goal-rm">${p.golesRM}</span>
                        <span class="goal-separator">-</span>
                        <span class="goal-fcb">${p.golesFCB}</span>
                    </span>
                    <span class="clasico-card-team"><img src="https://crests.football-data.org/81.png" alt="FCB" class="clasico-score-crest"/></span>
                </div>
            </div>
        `;
    }).join('');

    // Observar las nuevas tarjetas para animacion de entrada
    if (typeof observeNewElements === 'function') {
        observeNewElements(container);
    }
}

function renderH2HStats(dataService) {
    const clasico = dataService.getClasico();
    if (!clasico) return;

    // Racha actual
    const racha = clasico.rachaActual;
    if (racha) {
        const rachaEl = document.getElementById('h2h-racha-actual');
        if (rachaEl) {
            const equipoNombre = racha.equipo === 'rm' ? 'Real Madrid' : 'FC Barcelona';
            const colorClass = racha.equipo === 'rm' ? 'rm-color' : 'fcb-color';
            rachaEl.innerHTML = `
                <span class="h2h-racha-equipo ${colorClass}">${equipoNombre}</span>
                <span class="h2h-racha-num ${colorClass}">${racha.partidos}</span>
                <span class="h2h-racha-label">victorias consecutivas</span>
            `;
        }
    }

    // Goleadores historicos
    const goleadores = clasico.goleadoresHistoricos;
    if (goleadores && goleadores.length > 0) {
        const listEl = document.getElementById('h2h-scorers-list');
        if (listEl) {
            let currentRank = 1;
            let prevGoles = null;
            const ranked = goleadores.map((g, i) => {
                if (g.goles !== prevGoles) {
                    currentRank = i + 1;
                    prevGoles = g.goles;
                }
                return Object.assign({}, g, { rank: currentRank });
            });

            listEl.innerHTML = ranked.map(g => {
                const colorClass = g.equipo === 'rm' ? 'rm-color' : 'fcb-color';
                const teamLabel = g.equipo === 'rm' ? 'RM' : 'FCB';
                return `
                    <div class="h2h-scorer-row">
                        <span class="h2h-scorer-rank">${g.rank}</span>
                        <span class="h2h-scorer-name ${colorClass}">${g.nombre}</span>
                        <span class="h2h-scorer-team">${teamLabel}</span>
                        <span class="h2h-scorer-goals">${g.goles} goles</span>
                    </div>
                `;
            }).join('');
        }
    }
}
