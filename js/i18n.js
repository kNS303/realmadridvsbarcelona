/**
 * i18n - Sistema de internacionalizacion ES/EN
 * Uso: i18n.t('clave.subclave')
 */

const I18N = {
    es: {
        loading: 'Cargando estadisticas...',
        nav: {
            titulos:      'Titulos',
            historial:    'Historial',
            clasico:      'El Clasico',
            estadisticas: 'Estadisticas',
            jugadores:    'Jugadores',
            comparador:   'Comparador'
        },
        toggle: {
            historia:  'Toda la Historia',
            temporada: 'Temporada Actual'
        },
        hero: {
            clasicosDisputados:  'Clasicos disputados',
            golesEnClasicos:     'Goles en clasicos',
            subtitle:            'Mas de 125 anos de rivalidad',
            proximoClasico:      'Proximo Clasico',
            clasicosTemporada:   'Clasicos esta temporada',
            golesTemporada:      'Goles en clasicos esta temporada'
        },
        titulos: {
            sectionTitle:     'Palmares Comparativo',
            sectionSubtitle:  'Todos los titulos oficiales de ambos clubes',
            titulosTotales:   'Titulos totales',
            timelineTitle:    'Palmares por Decada',
            timelineSubtitle: 'Liga, Champions y Copa del Rey \u00b7 Real Madrid arriba \u00b7 FC Barcelona abajo',
            legendLiga:       'Liga',
            legendChampions:  'Champions',
            legendCopa:       'Copa del Rey',
            campeonDe:        'Campeon de'
        },
        historial: {
            sectionTitle:          'Historial General',
            sectionSubtitle:       'Rendimiento historico en todas las competiciones',
            sectionSubtitleSeason: 'Rendimiento en todas las competiciones de la temporada 2025-26',
            partidosJugados:       'Partidos jugados',
            golesAFavor:           'Goles a favor',
            golesRM:               'Goles Real Madrid',
            golesFCB:              'Goles FC Barcelona',
            sinDatos:              'Sin datos de clasificacion',
            standings: {
                title: 'Clasificacion La Liga',
                pos:    '#',
                equipo: 'Equipo',
                pts:    'Pts',
                pj:     'PJ',
                pg:     'PG',
                pe:     'PE',
                pp:     'PP',
                gf:     'GF',
                gc:     'GC',
                dg:     'DG'
            }
        },
        clasico: {
            sectionTitle:           'El Clasico',
            sectionSubtitle:        'Enfrentamientos directos a lo largo de la historia',
            sectionSubtitleSeason:  'Enfrentamientos directos en la temporada 2025-26',
            victoriasRM:            'Victorias RM',
            empates:                'Empates',
            victoriasFCB:           'Victorias FCB',
            resultadosGlobales:     'Resultados globales',
            porCompeticion:         'Por competicion',
            mayorGoleada:           'Mayor Goleada',
            rachaActual:            'Racha Actual',
            mejorRachaHistorica:    'Mejor Racha Historica',
            maximosGoleadores:      'Maximos Goleadores en El Clasico',
            victoriasConsecutivas:  'victorias consecutivas',
            goles:                  'goles',
            ultimosClasicos:        'Ultimos Clasicos',
            clasicosTemporada:      'Clasicos de la Temporada',
            evolucionDecada:        'Evolucion por decada',
            sinClasicos:            'No hay clasicos disputados en este periodo'
        },
        estadisticas: {
            sectionTitle:    'Estadisticas Detalladas',
            sectionSubtitle: 'Comparativa exhaustiva de rendimiento',
            disclaimer:      'Los datos detallados de esta seccion son estimaciones basadas en registros disponibles desde el inicio del tracking estadistico avanzado (c. 2000). Las cifras anteriores a esa fecha son extrapolaciones a partir de fuentes historicas parciales.'
        },
        jugadores: {
            sectionTitleHistory:       'Leyendas del Club',
            sectionTitleSeason:        'Jugadores Destacados',
            sectionSubtitleHistory:    'Maximos goleadores y asistentes de la historia',
            sectionSubtitleSeason:     'Maximos goleadores y asistentes de la temporada 2025-26',
            maximosGoleadores:         'Maximos Goleadores',
            maximosGoleadoresSeason:   'Maximos Goleadores de la Temporada',
            maximosAsistentes:         'Maximos Asistentes',
            maximosAsistentesSeason:   'Maximos Asistentes de la Temporada',
            jugador:                   'Jugador',
            goles:                     'Goles',
            asist:                     'Asist.',
            pj:                        'PJ',
            periodo:                   'Periodo'
        },
        comparador: {
            sectionTitle:    'Comparador de Jugadores',
            sectionSubtitle: 'Enfrentamiento cara a cara entre jugadores de ambos equipos',
            compartir:       'Compartir',
            generando:       'Generando...',
            disclaimer:      'N/D (No Disponible): las asistencias no se registraban oficialmente antes de los anos 90. Para jugadores de epocas anteriores al tracking estadistico moderno, este dato no existe en ninguna fuente fiable.',
            barras: {
                goles:       'Goles',
                asistencias: 'Asistencias',
                partidos:    'Partidos'
            },
            sinRegistros: 'Sin registros historicos',
            tituloImagen: 'Comparador de Jugadores'
        },
        footer: {
            title:      'El Clasico en Numeros',
            sources:    'Fuentes: Wikipedia, Transfermarkt, BDFutbol, RFEF',
            disclaimer: 'Los datos son aproximados y corresponden a registros historicos acumulados hasta marzo 2026.',
            copy:       '\u00a9 2026 - Dashboard informativo sin animo de lucro'
        },
        match: {
            victoria:       'Victoria',
            empate:         'Empate',
            derrota:        'Derrota',
            proximoPartido: 'Proximo partido'
        },
        charts: {
            victoriasRM:       'Victorias Real Madrid',
            victoriasFCB:      'Victorias FC Barcelona',
            empates:           'Empates',
            ganados:           'Ganados',
            empatados:         'Empatados',
            perdidos:          'Perdidos',
            golesAFavor:       'Goles a favor',
            golesEnContra:     'Goles en contra'
        },
        stats: {
            penaltisAFavor:    'Penaltis a favor',
            penaltisEnContra:  'Penaltis en contra',
            tarjetasAmarillas: 'Tarjetas amarillas',
            tarjetasRojas:     'Tarjetas rojas',
            corners:           'Corners',
            faltas:            'Faltas cometidas',
            fuerasDeJuego:     'Fueras de juego',
            posesionMedia:     'Posesion media (%)',
            tirosAPuerta:      'Tiros a puerta',
            tirosAFuera:       'Tiros a fuera'
        },
        radar: {
            penaltisAFavor:    'Penaltis a favor',
            penaltisEnContra:  'Penaltis en contra',
            tarjetasAmarillas: 'T. Amarillas',
            tarjetasRojas:     'T. Rojas',
            corners:           'Corners',
            posesionMedia:     'Posesion',
            tirosAPuerta:      'Tiros a puerta'
        }
    },

    en: {
        loading: 'Loading statistics...',
        nav: {
            titulos:      'Titles',
            historial:    'History',
            clasico:      'El Clasico',
            estadisticas: 'Statistics',
            jugadores:    'Players',
            comparador:   'Comparison'
        },
        toggle: {
            historia:  'All Time',
            temporada: 'Current Season'
        },
        hero: {
            clasicosDisputados:  'El Clasicos played',
            golesEnClasicos:     'Goals in El Clasicos',
            subtitle:            'Over 125 years of rivalry',
            proximoClasico:      'Next El Clasico',
            clasicosTemporada:   'El Clasicos this season',
            golesTemporada:      'Goals in El Clasicos this season'
        },
        titulos: {
            sectionTitle:     'Trophies Comparison',
            sectionSubtitle:  'All official titles of both clubs',
            titulosTotales:   'Total titles',
            timelineTitle:    'Titles by Decade',
            timelineSubtitle: 'Liga, Champions & Copa del Rey \u00b7 Real Madrid top \u00b7 FC Barcelona bottom',
            legendLiga:       'Liga',
            legendChampions:  'Champions',
            legendCopa:       'Copa del Rey',
            campeonDe:        'Champion of'
        },
        historial: {
            sectionTitle:          'Overall Record',
            sectionSubtitle:       'Historical performance across all competitions',
            sectionSubtitleSeason: 'Performance across all competitions in 2025-26',
            partidosJugados:       'Matches played',
            golesAFavor:           'Goals scored',
            golesRM:               'Real Madrid Goals',
            golesFCB:              'FC Barcelona Goals',
            sinDatos:              'No standings data available',
            standings: {
                title: 'La Liga Standings',
                pos:    '#',
                equipo: 'Club',
                pts:    'Pts',
                pj:     'MP',
                pg:     'W',
                pe:     'D',
                pp:     'L',
                gf:     'GF',
                gc:     'GA',
                dg:     'GD'
            }
        },
        clasico: {
            sectionTitle:           'El Clasico',
            sectionSubtitle:        'Head-to-head record throughout history',
            sectionSubtitleSeason:  'Head-to-head record in 2025-26',
            victoriasRM:            'RM Wins',
            empates:                'Draws',
            victoriasFCB:           'FCB Wins',
            resultadosGlobales:     'Overall results',
            porCompeticion:         'By competition',
            mayorGoleada:           'Biggest Win',
            rachaActual:            'Current Streak',
            mejorRachaHistorica:    'Best All-Time Streak',
            maximosGoleadores:      'Top Scorers in El Clasico',
            victoriasConsecutivas:  'consecutive wins',
            goles:                  'goals',
            ultimosClasicos:        'Recent Clasicos',
            clasicosTemporada:      'Clasicos this Season',
            evolucionDecada:        'Evolution by decade',
            sinClasicos:            'No El Clasicos played in this period'
        },
        estadisticas: {
            sectionTitle:    'Detailed Statistics',
            sectionSubtitle: 'Comprehensive performance comparison',
            disclaimer:      'Detailed data in this section are estimates based on records available since the start of advanced statistical tracking (c. 2000). Figures before that date are extrapolations from partial historical sources.'
        },
        jugadores: {
            sectionTitleHistory:       'Club Legends',
            sectionTitleSeason:        'Featured Players',
            sectionSubtitleHistory:    'All-time top scorers and assisters',
            sectionSubtitleSeason:     'Top scorers and assisters of 2025-26',
            maximosGoleadores:         'Top Scorers',
            maximosGoleadoresSeason:   'Top Scorers of the Season',
            maximosAsistentes:         'Top Assisters',
            maximosAsistentesSeason:   'Top Assisters of the Season',
            jugador:                   'Player',
            goles:                     'Goals',
            asist:                     'Asst.',
            pj:                        'MP',
            periodo:                   'Period'
        },
        comparador: {
            sectionTitle:    'Player Comparison',
            sectionSubtitle: 'Head-to-head between players from both sides',
            compartir:       'Share',
            generando:       'Generating...',
            disclaimer:      'N/A (Not Available): assists were not officially recorded before the 90s. For players from earlier eras, this data does not exist in any reliable source.',
            barras: {
                goles:       'Goals',
                asistencias: 'Assists',
                partidos:    'Matches'
            },
            sinRegistros: 'No historical records',
            tituloImagen: 'Player Comparison'
        },
        footer: {
            title:      'El Clasico in Numbers',
            sources:    'Sources: Wikipedia, Transfermarkt, BDFutbol, RFEF',
            disclaimer: 'Data is approximate and corresponds to historical records accumulated up to March 2026.',
            copy:       '\u00a9 2026 - Informational dashboard, non-commercial'
        },
        match: {
            victoria:       'Win',
            empate:         'Draw',
            derrota:        'Loss',
            proximoPartido: 'Next match'
        },
        charts: {
            victoriasRM:       'Real Madrid Wins',
            victoriasFCB:      'FC Barcelona Wins',
            empates:           'Draws',
            ganados:           'Won',
            empatados:         'Drawn',
            perdidos:          'Lost',
            golesAFavor:       'Goals scored',
            golesEnContra:     'Goals conceded'
        },
        stats: {
            penaltisAFavor:    'Penalties won',
            penaltisEnContra:  'Penalties against',
            tarjetasAmarillas: 'Yellow cards',
            tarjetasRojas:     'Red cards',
            corners:           'Corners',
            faltas:            'Fouls committed',
            fuerasDeJuego:     'Offsides',
            posesionMedia:     'Avg. possession (%)',
            tirosAPuerta:      'Shots on target',
            tirosAFuera:       'Shots wide'
        },
        radar: {
            penaltisAFavor:    'Penalties won',
            penaltisEnContra:  'Penalties against',
            tarjetasAmarillas: 'Yellow cards',
            tarjetasRojas:     'Red cards',
            corners:           'Corners',
            posesionMedia:     'Possession',
            tirosAPuerta:      'Shots on target'
        }
    }
};

const i18n = {
    _lang: 'es',

    /**
     * Obtiene la traduccion para una clave separada por puntos
     * Ej: i18n.t('nav.titulos') -> 'Titulos' / 'Titles'
     */
    t(key) {
        const keys = key.split('.');
        let obj = I18N[this._lang];
        for (const k of keys) {
            if (obj == null || typeof obj !== 'object') return key;
            obj = obj[k];
        }
        return (obj !== undefined && obj !== null && typeof obj !== 'object') ? obj : key;
    },

    setLanguage(lang) {
        if (!I18N[lang]) return;
        this._lang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
    },

    getLanguage() {
        return this._lang;
    },

    /**
     * Inicializa el idioma desde localStorage o deteccion del navegador
     */
    init() {
        const saved = localStorage.getItem('lang');
        if (saved && I18N[saved]) {
            this._lang = saved;
        } else {
            const nav = (navigator.language || '').toLowerCase();
            if (nav.startsWith('en')) this._lang = 'en';
        }
        document.documentElement.lang = this._lang;
    },

    /**
     * Aplica traducciones a todos los elementos [data-i18n] del DOM
     */
    applyToDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.textContent = translation;
            }
        });
    }
};
