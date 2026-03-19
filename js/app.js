/**
 * App - Orquestador principal
 * Inicializa datos, gráficos, tablas y animaciones
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Cargar datos
        const dataService = new DataService();
        const data = await dataService.init();

        // 2. Inicializar navegación
        initNavigation();

        // 3. Crear gráficos con lazy loading (solo cuando son visibles)
        initLazyCharts(dataService);

        // 4. Crear tablas de jugadores
        const jugadores = dataService.getJugadores();
        createPlayerTable('table-goleadores-rm', jugadores.goleadores.realMadrid, 'goles', 'rm');
        createPlayerTable('table-goleadores-fcb', jugadores.goleadores.barcelona, 'goles', 'fcb');
        createPlayerTable('table-asistentes-rm', jugadores.asistentes.realMadrid, 'asistencias', 'rm');
        createPlayerTable('table-asistentes-fcb', jugadores.asistentes.barcelona, 'asistencias', 'fcb');

        // 5. Renderizar último partido en el Hero
        renderLastMatch('last-match-rm', dataService.getUltimoPartido('realMadrid'));
        renderLastMatch('last-match-fcb', dataService.getUltimoPartido('barcelona'));

        // 6. Crear barras comparativas CSS
        initComparativeBars(dataService.getEstadisticas());

        // 7. Inicializar animaciones de scroll (después de crear todo el DOM)
        initScrollAnimations();

        // 8. Ocultar loading, mostrar contenido
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error('Error inicializando la app:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ff4444; text-align: center;">
                Error cargando los datos.<br>
                <small style="color: #999;">Asegurate de servir la pagina desde un servidor local (Live Server, etc.)</small>
            </p>
        `;
    }
});

/**
 * Lazy loading de gráficos: solo se crean cuando su sección es visible
 */
function initLazyCharts(dataService) {
    const chartConfigs = [
        {
            sectionId: 'titulos',
            create: () => {
                const titulos = dataService.getTitulos();
                ChartFactory.createTitulosBar('chart-titulos-bar', titulos);
                ChartFactory.createTitulosDonut('chart-titulos-donut-rm', titulos.realMadrid, titulos.labels, true);
                ChartFactory.createTitulosDonut('chart-titulos-donut-fcb', titulos.barcelona, titulos.labels, false);
            }
        },
        {
            sectionId: 'historial',
            create: () => {
                const historial = dataService.getHistorial();
                ChartFactory.createHistorialBar('chart-historial-bar', historial);
                ChartFactory.createGolesDonut('chart-goles-donut-rm', historial.realMadrid, true);
                ChartFactory.createGolesDonut('chart-goles-donut-fcb', historial.barcelona, false);
            }
        },
        {
            sectionId: 'clasico',
            create: () => {
                const clasico = dataService.getClasico();
                ChartFactory.createClasicoDonut('chart-clasico-donut', clasico);
                ChartFactory.createClasicoCompeticion('chart-clasico-competicion', clasico.porCompeticion);
                ChartFactory.createClasicoTimeline('chart-clasico-timeline', clasico.evolucionHistorica);
            }
        },
        {
            sectionId: 'estadisticas',
            create: () => {
                const stats = dataService.getEstadisticas();
                ChartFactory.createRadarChart('chart-radar', stats);
            }
        }
    ];

    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const config = chartConfigs.find(c => c.sectionId === entry.target.id);
                if (config) {
                    // Pequeño delay para que la animación de entrada del contenedor ocurra primero
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

/**
 * Navegación: scroll suave, menú hamburguesa, sección activa
 */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const links = navLinks.querySelectorAll('a');

    // Toggle hamburguesa
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Cerrar menú al hacer click en un link
    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Resaltar sección activa
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

    // Cerrar menú al hacer scroll
    window.addEventListener('scroll', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    }, { passive: true });

    // Cambiar opacidad del nav al hacer scroll
    const nav = document.getElementById('main-nav');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 100) {
            nav.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            nav.style.background = 'rgba(10, 10, 15, 0.85)';
        }
        lastScroll = currentScroll;
    }, { passive: true });
}

/**
 * Renderiza el último partido jugado bajo el escudo del equipo
 */
function renderLastMatch(containerId, matchData) {
    const container = document.getElementById(containerId);
    if (!container || !matchData) return;

    const { rival, golesLocal, golesVisitante, esLocal, resultado } = matchData;

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

    container.innerHTML = `
        <span class="match-opponent">vs ${rival}</span>
        <span class="match-score">${score}</span>
        <span class="match-result ${cssClass}">${label}</span>
    `;
}