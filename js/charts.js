/**
 * ChartFactory - Fábricas de gráficos Chart.js
 * Cada método crea y retorna una instancia de Chart
 */
const ChartFactory = {

    // Colores globales
    colors: {
        rmGold: '#D4A012',
        rmGoldAlpha: 'rgba(212, 160, 18, 0.5)',
        rmGoldBg: 'rgba(212, 160, 18, 0.10)',
        fcbGarnet: '#9B1B4D',
        fcbGarnetAlpha: 'rgba(155, 27, 77, 0.5)',
        fcbGarnetBg: 'rgba(155, 27, 77, 0.10)',
        fcbBlue: '#004D98',
        neutral: '#3a3a3c',
        neutralAlpha: 'rgba(58, 58, 60, 0.5)',
        text: '#8e8e93',
        grid: 'rgba(200, 200, 200, 0.04)'
    },

    // Configuración de tooltip global en español
    tooltipConfig: {
        backgroundColor: 'rgba(28, 28, 30, 0.96)',
        titleColor: '#d1d1d6',
        bodyColor: '#8e8e93',
        borderColor: 'rgba(200, 200, 200, 0.08)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { family: "'DM Sans', sans-serif", weight: '600' },
        bodyFont: { family: "'DM Sans', sans-serif" },
    },

    /**
     * 1. Títulos - Barras horizontales face-to-face
     */
    createTitulosBar(canvasId, titulosData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(titulosData.labels).map(k => titulosData.labels[k]);
        const keys = Object.keys(titulosData.labels);
        const rmValues = keys.map(k => titulosData.realMadrid[k] || 0);
        const fcbValues = keys.map(k => -(titulosData.barcelona[k] || 0));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Real Madrid',
                        data: rmValues,
                        backgroundColor: this.colors.rmGoldAlpha,
                        borderColor: this.colors.rmGold,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'FC Barcelona',
                        data: fcbValues,
                        backgroundColor: this.colors.fcbGarnetAlpha,
                        borderColor: this.colors.fcbGarnet,
                        borderWidth: 1,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text,
                            usePointStyle: true,
                            font: { family: "'DM Sans', sans-serif", size: 12 }
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => {
                                const val = Math.abs(ctx.raw);
                                return `${ctx.dataset.label}: ${val}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: this.colors.grid },
                        ticks: {
                            color: this.colors.text,
                            callback: (val) => Math.abs(val),
                            font: { size: 11 }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: this.colors.text,
                            font: { family: "'DM Sans', sans-serif", size: 11 }
                        }
                    }
                }
            }
        });
    },

    /**
     * 2. Títulos - Donut de distribución por equipo
     */
    createTitulosDonut(canvasId, titulos, labels, isRM) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const keys = Object.keys(labels);
        const values = keys.map(k => titulos[k] || 0);
        const displayLabels = keys.map(k => labels[k]);
        const total = values.reduce((a, b) => a + b, 0);

        const baseColor = isRM ? [212, 160, 18] : [155, 27, 77];
        const bgColors = values.map((_, i) => {
            const opacity = 0.4 + (i / values.length) * 0.6;
            return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${opacity})`;
        });

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: displayLabels,
                datasets: [{
                    data: values,
                    backgroundColor: bgColors,
                    borderColor: 'rgba(28, 28, 30, 0.9)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.colors.text,
                            font: { size: 10, family: "'DM Sans', sans-serif" },
                            usePointStyle: true,
                            padding: 8,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 3. Historial - Barras comparativas G/E/P
     */
    createHistorialBar(canvasId, historial) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ganados', 'Empatados', 'Perdidos', 'Goles a favor', 'Goles en contra'],
                datasets: [
                    {
                        label: 'Real Madrid',
                        data: [
                            historial.realMadrid.ganados,
                            historial.realMadrid.empatados,
                            historial.realMadrid.perdidos,
                            historial.realMadrid.golesAFavor,
                            historial.realMadrid.golesEnContra
                        ],
                        backgroundColor: this.colors.rmGoldAlpha,
                        borderColor: this.colors.rmGold,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'FC Barcelona',
                        data: [
                            historial.barcelona.ganados,
                            historial.barcelona.empatados,
                            historial.barcelona.perdidos,
                            historial.barcelona.golesAFavor,
                            historial.barcelona.golesEnContra
                        ],
                        backgroundColor: this.colors.fcbGarnetAlpha,
                        borderColor: this.colors.fcbGarnet,
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text,
                            usePointStyle: true,
                            font: { family: "'DM Sans', sans-serif", size: 12 }
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString('es-ES')}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: this.colors.text,
                            font: { size: 11 }
                        }
                    },
                    y: {
                        grid: { color: this.colors.grid },
                        ticks: {
                            color: this.colors.text,
                            callback: (val) => val.toLocaleString('es-ES'),
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    },

    /**
     * 4. Goles - Donut a favor/en contra
     */
    createGolesDonut(canvasId, teamData, isRM) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const primary = isRM ? this.colors.rmGold : this.colors.fcbGarnet;
        const secondary = isRM ? this.colors.rmGoldAlpha : this.colors.fcbGarnetAlpha;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Goles a favor', 'Goles en contra'],
                datasets: [{
                    data: [teamData.golesAFavor, teamData.golesEnContra],
                    backgroundColor: [primary, secondary],
                    borderColor: 'rgba(28, 28, 30, 0.9)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.colors.text,
                            font: { size: 11, family: "'DM Sans', sans-serif" },
                            usePointStyle: true,
                            padding: 12
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString('es-ES')}`
                        }
                    }
                }
            }
        });
    },

    /**
     * 5. El Clásico - Donut de resultados globales
     */
    createClasicoDonut(canvasId, clasico) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Victorias Real Madrid', 'Victorias FC Barcelona', 'Empates'],
                datasets: [{
                    data: [clasico.victoriasRealMadrid, clasico.victoriasBarcelona, clasico.empates],
                    backgroundColor: [this.colors.rmGold, this.colors.fcbGarnet, this.colors.neutralAlpha],
                    borderColor: 'rgba(28, 28, 30, 0.9)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.colors.text,
                            font: { size: 11, family: "'DM Sans', sans-serif" },
                            usePointStyle: true,
                            padding: 12
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.raw / clasico.totalPartidos) * 100).toFixed(1);
                                return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 6. El Clásico - Por competición (barras agrupadas)
     */
    createClasicoCompeticion(canvasId, porCompeticion) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const compLabels = { liga: 'Liga', copaDelRey: 'Copa del Rey', championsLeague: 'Champions', supercopa: 'Supercopa' };
        const keys = Object.keys(compLabels);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: keys.map(k => compLabels[k]),
                datasets: [
                    {
                        label: 'Real Madrid',
                        data: keys.map(k => porCompeticion[k].rmVictorias),
                        backgroundColor: this.colors.rmGoldAlpha,
                        borderColor: this.colors.rmGold,
                        borderWidth: 1,
                        borderRadius: 3
                    },
                    {
                        label: 'FC Barcelona',
                        data: keys.map(k => porCompeticion[k].fcbVictorias),
                        backgroundColor: this.colors.fcbGarnetAlpha,
                        borderColor: this.colors.fcbGarnet,
                        borderWidth: 1,
                        borderRadius: 3
                    },
                    {
                        label: 'Empates',
                        data: keys.map(k => porCompeticion[k].empates),
                        backgroundColor: this.colors.neutralAlpha,
                        borderColor: this.colors.neutral,
                        borderWidth: 1,
                        borderRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text,
                            usePointStyle: true,
                            font: { size: 10, family: "'DM Sans', sans-serif" }
                        }
                    },
                    tooltip: this.tooltipConfig
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: this.colors.text, font: { size: 10 } }
                    },
                    y: {
                        grid: { color: this.colors.grid },
                        ticks: { color: this.colors.text, font: { size: 10 } }
                    }
                }
            }
        });
    },

    /**
     * 7. El Clásico - Evolución por década (línea temporal)
     */
    createClasicoTimeline(canvasId, evolucion) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: evolucion.map(e => e.decada),
                datasets: [
                    {
                        label: 'Victorias Real Madrid',
                        data: evolucion.map(e => e.rmVictorias),
                        borderColor: this.colors.rmGold,
                        backgroundColor: this.colors.rmGoldBg,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: this.colors.rmGold,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Victorias FC Barcelona',
                        data: evolucion.map(e => e.fcbVictorias),
                        borderColor: this.colors.fcbGarnet,
                        backgroundColor: this.colors.fcbGarnetBg,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: this.colors.fcbGarnet,
                        borderWidth: 2.5
                    },
                    {
                        label: 'Empates',
                        data: evolucion.map(e => e.empates),
                        borderColor: this.colors.neutral,
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.colors.neutral,
                        borderWidth: 1.5,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 2000, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text,
                            usePointStyle: true,
                            font: { size: 11, family: "'DM Sans', sans-serif" }
                        }
                    },
                    tooltip: this.tooltipConfig
                },
                scales: {
                    x: {
                        grid: { color: this.colors.grid },
                        ticks: { color: this.colors.text, font: { size: 11 } }
                    },
                    y: {
                        grid: { color: this.colors.grid },
                        ticks: { color: this.colors.text, font: { size: 11 } },
                        beginAtZero: true
                    }
                }
            }
        });
    },

    /**
     * 8. Estadísticas - Radar / Spider chart
     */
    createRadarChart(canvasId, statsData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Normalize stats to 0-100 scale for radar
        const radarKeys = ['penaltisAFavor', 'penaltisEnContra', 'tarjetasAmarillas', 'tarjetasRojas', 'corners', 'posesionMedia', 'tirosAPuerta'];
        const radarLabels = {
            penaltisAFavor: 'Penaltis a favor',
            penaltisEnContra: 'Penaltis en contra',
            tarjetasAmarillas: 'T. Amarillas',
            tarjetasRojas: 'T. Rojas',
            corners: 'Corners',
            posesionMedia: 'Posesión',
            tirosAPuerta: 'Tiros a puerta'
        };

        // Normalize: for each key, find max between both teams and scale to 100
        const maxValues = {};
        radarKeys.forEach(k => {
            maxValues[k] = Math.max(statsData.realMadrid[k], statsData.barcelona[k]);
        });

        const rmNormalized = radarKeys.map(k => maxValues[k] > 0 ? (statsData.realMadrid[k] / maxValues[k]) * 100 : 0);
        const fcbNormalized = radarKeys.map(k => maxValues[k] > 0 ? (statsData.barcelona[k] / maxValues[k]) * 100 : 0);

        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: radarKeys.map(k => radarLabels[k]),
                datasets: [
                    {
                        label: 'Real Madrid',
                        data: rmNormalized,
                        borderColor: this.colors.rmGold,
                        backgroundColor: 'rgba(212, 160, 18, 0.12)',
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: this.colors.rmGold,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'FC Barcelona',
                        data: fcbNormalized,
                        borderColor: this.colors.fcbGarnet,
                        backgroundColor: 'rgba(155, 27, 77, 0.12)',
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: this.colors.fcbGarnet,
                        pointHoverRadius: 7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1500, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        labels: {
                            color: this.colors.text,
                            usePointStyle: true,
                            font: { size: 12, family: "'DM Sans', sans-serif" }
                        }
                    },
                    tooltip: {
                        ...this.tooltipConfig,
                        callbacks: {
                            label: (ctx) => {
                                const key = radarKeys[ctx.dataIndex];
                                const team = ctx.datasetIndex === 0 ? 'realMadrid' : 'barcelona';
                                const realVal = statsData[team][key];
                                return ` ${ctx.dataset.label}: ${realVal.toLocaleString('es-ES')}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(200, 200, 200, 0.05)' },
                        angleLines: { color: 'rgba(200, 200, 200, 0.05)' },
                        pointLabels: {
                            color: this.colors.text,
                            font: { size: 11, family: "'DM Sans', sans-serif" }
                        },
                        ticks: {
                            display: false,
                            stepSize: 20
                        },
                        beginAtZero: true,
                        max: 105
                    }
                }
            }
        });
    }
};