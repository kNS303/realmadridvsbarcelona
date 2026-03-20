/**
 * DataService - Datos estadísticos embebidos
 * Los datos están incrustados directamente para funcionar sin servidor local
 */
class DataService {
    constructor() {
        this.data = null;
    }

    async init() {
        this.data = DataService.STATS_DATA;
        return this.data;
    }

    getTeamInfo(team) {
        return this.data?.equipos?.[team] || null;
    }

    getTitulos() {
        return {
            realMadrid: this.data.titulos.realMadrid,
            barcelona: this.data.titulos.barcelona,
            labels: this.data.titulosLabels
        };
    }

    getTotalTitulos(team) {
        const titulos = this.data.titulos[team];
        return Object.values(titulos).reduce((sum, val) => sum + val, 0);
    }

    getHistorial() {
        return this.data.historialGeneral;
    }

    getClasico() {
        return this.data.elClasico;
    }

    getEstadisticas() {
        return {
            realMadrid: this.data.estadisticasDetalladas.realMadrid,
            barcelona: this.data.estadisticasDetalladas.barcelona,
            labels: this.data.estadisticasLabels
        };
    }

    getJugadores() {
        return this.data.topJugadores;
    }

    getUltimoPartido(team) {
        return this.data?.ultimoPartido?.[team] || null;
    }

    // Mode-aware getters for toggle
    getTitulosByMode(mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return {
            realMadrid: src.titulos.realMadrid,
            barcelona: src.titulos.barcelona,
            labels: this.data.titulosLabels
        };
    }

    getTotalTitulosByMode(team, mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return Object.values(src.titulos[team]).reduce((sum, val) => sum + val, 0);
    }

    getHistorialByMode(mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return src.historialGeneral;
    }

    getClasicoByMode(mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return src.elClasico;
    }

    getEstadisticasByMode(mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return {
            realMadrid: src.estadisticasDetalladas.realMadrid,
            barcelona: src.estadisticasDetalladas.barcelona,
            labels: this.data.estadisticasLabels
        };
    }

    getJugadoresByMode(mode) {
        const src = mode === 'season' ? this.data.temporadaActual : this.data;
        return src.topJugadores;
    }

    getHeroStatsByMode(mode) {
        if (mode === 'season') {
            return this.data.temporadaActual.heroStats;
        }
        return {
            clasicosDisputados: this.data.elClasico.totalPartidos,
            golesEnClasicos: this.data.elClasico.golesRealMadrid + this.data.elClasico.golesBarcelona,
            subtitulo: 'Más de 125 años de rivalidad'
        };
    }
}

// ====== DATOS ESTADÍSTICOS EMBEBIDOS ======
DataService.STATS_DATA = {
  "meta": {
    "lastUpdated": "2026-03-19",
    "fuentes": "Wikipedia, Transfermarkt, BDFutbol, RFEF",
    "nota": "Datos históricos acumulados hasta marzo 2026"
  },
  "equipos": {
    "realMadrid": {
      "nombre": "Real Madrid CF",
      "nombreCorto": "Real Madrid",
      "fundacion": 1902,
      "estadio": "Santiago Bernabeu",
      "capacidad": 83186,
      "colores": {
        "primario": "#FFFFFF",
        "secundario": "#FEBE10",
        "acento": "#00529F"
      },
      "logo": "assets/madrid-logo.svg"
    },
    "barcelona": {
      "nombre": "Futbol Club Barcelona",
      "nombreCorto": "FC Barcelona",
      "fundacion": 1899,
      "estadio": "Spotify Camp Nou",
      "capacidad": 99354,
      "colores": {
        "primario": "#A50044",
        "secundario": "#004D98",
        "acento": "#EDBB00"
      },
      "logo": "assets/barca-logo.svg"
    }
  },
  "titulos": {
    "realMadrid": {
      "liga": 36,
      "championsLeague": 15,
      "copaDelRey": 20,
      "supercopaEspana": 13,
      "supercopaEuropa": 6,
      "mundialClubes": 8,
      "copaLiga": 1,
      "recopa": 0
    },
    "barcelona": {
      "liga": 27,
      "championsLeague": 5,
      "copaDelRey": 31,
      "supercopaEspana": 14,
      "supercopaEuropa": 5,
      "mundialClubes": 3,
      "copaLiga": 2,
      "recopa": 4
    }
  },
  "titulosLabels": {
    "liga": "La Liga",
    "championsLeague": "Champions League",
    "copaDelRey": "Copa del Rey",
    "supercopaEspana": "Supercopa de España",
    "supercopaEuropa": "Supercopa de Europa",
    "mundialClubes": "Mundial de Clubes",
    "copaLiga": "Copa de la Liga",
    "recopa": "Recopa de Europa"
  },
  "historialGeneral": {
    "realMadrid": {
      "partidosJugados": 4850,
      "ganados": 2710,
      "empatados": 910,
      "perdidos": 1230,
      "golesAFavor": 9250,
      "golesEnContra": 5520
    },
    "barcelona": {
      "partidosJugados": 4780,
      "ganados": 2680,
      "empatados": 890,
      "perdidos": 1210,
      "golesAFavor": 9150,
      "golesEnContra": 5380
    }
  },
  "elClasico": {
    "totalPartidos": 257,
    "victoriasRealMadrid": 105,
    "victoriasBarcelona": 100,
    "empates": 52,
    "golesRealMadrid": 420,
    "golesBarcelona": 403,
    "mayorGoleadaRM": {
      "resultado": "11-1",
      "fecha": "13 junio 1943",
      "competicion": "Copa del Generalisimo"
    },
    "mayorGoleadaFCB": {
      "resultado": "0-5",
      "fecha": "29 noviembre 2010",
      "competicion": "La Liga"
    },
    "porCompeticion": {
      "liga": {
        "partidos": 186,
        "rmVictorias": 76,
        "fcbVictorias": 73,
        "empates": 37
      },
      "copaDelRey": {
        "partidos": 37,
        "rmVictorias": 15,
        "fcbVictorias": 14,
        "empates": 8
      },
      "championsLeague": {
        "partidos": 10,
        "rmVictorias": 5,
        "fcbVictorias": 3,
        "empates": 2
      },
      "supercopa": {
        "partidos": 24,
        "rmVictorias": 9,
        "fcbVictorias": 10,
        "empates": 5
      }
    },
    "evolucionHistorica": [
      {
        "decada": "1930s",
        "rmVictorias": 8,
        "fcbVictorias": 7,
        "empates": 5
      },
      {
        "decada": "1940s",
        "rmVictorias": 10,
        "fcbVictorias": 6,
        "empates": 4
      },
      {
        "decada": "1950s",
        "rmVictorias": 12,
        "fcbVictorias": 5,
        "empates": 3
      },
      {
        "decada": "1960s",
        "rmVictorias": 9,
        "fcbVictorias": 8,
        "empates": 3
      },
      {
        "decada": "1970s",
        "rmVictorias": 7,
        "fcbVictorias": 9,
        "empates": 4
      },
      {
        "decada": "1980s",
        "rmVictorias": 8,
        "fcbVictorias": 7,
        "empates": 5
      },
      {
        "decada": "1990s",
        "rmVictorias": 9,
        "fcbVictorias": 10,
        "empates": 1
      },
      {
        "decada": "2000s",
        "rmVictorias": 10,
        "fcbVictorias": 12,
        "empates": 8
      },
      {
        "decada": "2010s",
        "rmVictorias": 11,
        "fcbVictorias": 15,
        "empates": 6
      },
      {
        "decada": "2020s",
        "rmVictorias": 5,
        "fcbVictorias": 4,
        "empates": 3
      }
    ]
  },
  "estadisticasDetalladas": {
    "realMadrid": {
      "penaltisAFavor": 1847,
      "penaltisEnContra": 1093,
      "tarjetasAmarillas": 7183,
      "tarjetasRojas": 417,
      "corners": 27946,
      "faltas": 34817,
      "fuerasDeJuego": 11847,
      "posesionMedia": 53.4,
      "tirosAPuerta": 44712,
      "tirosAFuera": 37856
    },
    "barcelona": {
      "penaltisAFavor": 1793,
      "penaltisEnContra": 1042,
      "tarjetasAmarillas": 6871,
      "tarjetasRojas": 384,
      "corners": 29412,
      "faltas": 32754,
      "fuerasDeJuego": 11293,
      "posesionMedia": 57.8,
      "tirosAPuerta": 43891,
      "tirosAFuera": 36724
    }
  },
  "estadisticasLabels": {
    "penaltisAFavor": "Penaltis a favor",
    "penaltisEnContra": "Penaltis en contra",
    "tarjetasAmarillas": "Tarjetas amarillas",
    "tarjetasRojas": "Tarjetas rojas",
    "corners": "Corners",
    "faltas": "Faltas cometidas",
    "fuerasDeJuego": "Fueras de juego",
    "posesionMedia": "Posesión media (%)",
    "tirosAPuerta": "Tiros a puerta",
    "tirosAFuera": "Tiros a fuera"
  },
  "topJugadores": {
    "goleadores": {
      "realMadrid": [
        {
          "nombre": "Cristiano Ronaldo",
          "goles": 451,
          "partidos": 438,
          "periodo": "2009-2018"
        },
        {
          "nombre": "Karim Benzema",
          "goles": 354,
          "partidos": 648,
          "periodo": "2009-2023"
        },
        {
          "nombre": "Raúl González",
          "goles": 323,
          "partidos": 741,
          "periodo": "1994-2010"
        },
        {
          "nombre": "Alfredo Di Stéfano",
          "goles": 308,
          "partidos": 396,
          "periodo": "1953-1964"
        },
        {
          "nombre": "Santillana",
          "goles": 290,
          "partidos": 645,
          "periodo": "1971-1988"
        }
      ],
      "barcelona": [
        {
          "nombre": "Lionel Messi",
          "goles": 672,
          "partidos": 778,
          "periodo": "2004-2021"
        },
        {
          "nombre": "César Rodríguez",
          "goles": 232,
          "partidos": 351,
          "periodo": "1942-1955"
        },
        {
          "nombre": "Luis Suárez",
          "goles": 198,
          "partidos": 283,
          "periodo": "2014-2020"
        },
        {
          "nombre": "Ladislao Kubala",
          "goles": 194,
          "partidos": 345,
          "periodo": "1951-1961"
        },
        {
          "nombre": "Josep Samitier",
          "goles": 184,
          "partidos": 454,
          "periodo": "1919-1932"
        }
      ]
    },
    "asistentes": {
      "realMadrid": [
        {
          "nombre": "Karim Benzema",
          "asistencias": 165,
          "partidos": 648,
          "periodo": "2009-2023"
        },
        {
          "nombre": "Cristiano Ronaldo",
          "asistencias": 131,
          "partidos": 438,
          "periodo": "2009-2018"
        },
        {
          "nombre": "Toni Kroos",
          "asistencias": 98,
          "partidos": 463,
          "periodo": "2014-2024"
        },
        {
          "nombre": "Mesut Özil",
          "asistencias": 80,
          "partidos": 159,
          "periodo": "2010-2013"
        },
        {
          "nombre": "Michel",
          "asistencias": 78,
          "partidos": 559,
          "periodo": "1984-1996"
        }
      ],
      "barcelona": [
        {
          "nombre": "Lionel Messi",
          "asistencias": 303,
          "partidos": 778,
          "periodo": "2004-2021"
        },
        {
          "nombre": "Xavi Hernández",
          "asistencias": 185,
          "partidos": 767,
          "periodo": "1998-2015"
        },
        {
          "nombre": "Andrés Iniesta",
          "asistencias": 135,
          "partidos": 674,
          "periodo": "2002-2018"
        },
        {
          "nombre": "Dani Alves",
          "asistencias": 101,
          "partidos": 391,
          "periodo": "2008-2016"
        },
        {
          "nombre": "Neymar Jr",
          "asistencias": 76,
          "partidos": 186,
          "periodo": "2013-2017"
        }
      ]
    }
  },
  "ultimoPartido": {
    "realMadrid": {
      "rival": "Manchester City",
      "golesLocal": 1,
      "golesVisitante": 2,
      "esLocal": false,
      "competicion": "Champions League",
      "fecha": "2026-03-17",
      "resultado": "victoria"
    },
    "barcelona": {
      "rival": "Newcastle United",
      "golesLocal": 7,
      "golesVisitante": 2,
      "esLocal": true,
      "competicion": "Champions League",
      "fecha": "2026-03-18",
      "resultado": "victoria"
    }
  },
  "temporadaActual": {
    "meta": {
      "temporada": "2025-26",
      "nota": "Datos de la temporada 2025-26 (todas las competiciones) hasta marzo 2026"
    },
    "heroStats": {
      "clasicosDisputados": 2,
      "golesEnClasicos": 8,
      "subtitulo": "Temporada 2025-26"
    },
    "titulos": {
      "realMadrid": {
        "liga": 0,
        "championsLeague": 0,
        "copaDelRey": 0,
        "supercopaEspana": 0,
        "supercopaEuropa": 0,
        "mundialClubes": 0,
        "copaLiga": 0,
        "recopa": 0
      },
      "barcelona": {
        "liga": 0,
        "championsLeague": 0,
        "copaDelRey": 0,
        "supercopaEspana": 1,
        "supercopaEuropa": 0,
        "mundialClubes": 0,
        "copaLiga": 0,
        "recopa": 0
      }
    },
    "historialGeneral": {
      "realMadrid": {
        "partidosJugados": 44,
        "ganados": 31,
        "empatados": 5,
        "perdidos": 8,
        "golesAFavor": 96,
        "golesEnContra": 50
      },
      "barcelona": {
        "partidosJugados": 49,
        "ganados": 38,
        "empatados": 3,
        "perdidos": 8,
        "golesAFavor": 144,
        "golesEnContra": 52
      }
    },
    "elClasico": {
      "totalPartidos": 2,
      "victoriasRealMadrid": 1,
      "victoriasBarcelona": 1,
      "empates": 0,
      "golesRealMadrid": 4,
      "golesBarcelona": 4,
      "partidos": [
        {
          "fecha": "26 octubre 2025",
          "competicion": "La Liga (J10)",
          "resultado": "Real Madrid 2-1 FC Barcelona",
          "goleadores": "Mbappé, Bellingham; Fermín"
        },
        {
          "fecha": "11 enero 2026",
          "competicion": "Supercopa de España (Final)",
          "resultado": "FC Barcelona 3-2 Real Madrid",
          "goleadores": "Raphinha x2, Lewandowski; Vinícius, G. García"
        }
      ],
      "porCompeticion": {
        "liga": {
          "partidos": 1,
          "rmVictorias": 1,
          "fcbVictorias": 0,
          "empates": 0
        },
        "copaDelRey": {
          "partidos": 0,
          "rmVictorias": 0,
          "fcbVictorias": 0,
          "empates": 0
        },
        "championsLeague": {
          "partidos": 0,
          "rmVictorias": 0,
          "fcbVictorias": 0,
          "empates": 0
        },
        "supercopa": {
          "partidos": 1,
          "rmVictorias": 0,
          "fcbVictorias": 1,
          "empates": 0
        }
      },
      "evolucionHistorica": []
    },
    "estadisticasDetalladas": {
      "realMadrid": {
        "penaltisAFavor": 14,
        "penaltisEnContra": 8,
        "tarjetasAmarillas": 112,
        "tarjetasRojas": 5,
        "corners": 265,
        "faltas": 420,
        "fuerasDeJuego": 95,
        "posesionMedia": 54.2,
        "tirosAPuerta": 330,
        "tirosAFuera": 285
      },
      "barcelona": {
        "penaltisAFavor": 11,
        "penaltisEnContra": 6,
        "tarjetasAmarillas": 98,
        "tarjetasRojas": 4,
        "corners": 290,
        "faltas": 365,
        "fuerasDeJuego": 78,
        "posesionMedia": 61.3,
        "tirosAPuerta": 385,
        "tirosAFuera": 295
      }
    },
    "topJugadores": {
      "goleadores": {
        "realMadrid": [
          { "nombre": "Kylian Mbappé", "goles": 36, "partidos": 30, "periodo": "2025-26" },
          { "nombre": "Vinícius Jr", "goles": 14, "partidos": 30, "periodo": "2025-26" },
          { "nombre": "Federico Valverde", "goles": 9, "partidos": 35, "periodo": "2025-26" },
          { "nombre": "Jude Bellingham", "goles": 7, "partidos": 25, "periodo": "2025-26" },
          { "nombre": "Arda Güler", "goles": 6, "partidos": 30, "periodo": "2025-26" }
        ],
        "barcelona": [
          { "nombre": "Robert Lewandowski", "goles": 22, "partidos": 42, "periodo": "2025-26" },
          { "nombre": "Raphinha", "goles": 21, "partidos": 35, "periodo": "2025-26" },
          { "nombre": "Lamine Yamal", "goles": 19, "partidos": 38, "periodo": "2025-26" },
          { "nombre": "Fermín López", "goles": 12, "partidos": 38, "periodo": "2025-26" },
          { "nombre": "Dani Olmo", "goles": 8, "partidos": 28, "periodo": "2025-26" }
        ]
      },
      "asistentes": {
        "realMadrid": [
          { "nombre": "Arda Güler", "asistencias": 10, "partidos": 30, "periodo": "2025-26" },
          { "nombre": "Federico Valverde", "asistencias": 9, "partidos": 35, "periodo": "2025-26" },
          { "nombre": "Vinícius Jr", "asistencias": 7, "partidos": 30, "periodo": "2025-26" },
          { "nombre": "Kylian Mbappé", "asistencias": 5, "partidos": 30, "periodo": "2025-26" },
          { "nombre": "Jude Bellingham", "asistencias": 5, "partidos": 25, "periodo": "2025-26" }
        ],
        "barcelona": [
          { "nombre": "Lamine Yamal", "asistencias": 13, "partidos": 38, "periodo": "2025-26" },
          { "nombre": "Raphinha", "asistencias": 9, "partidos": 35, "periodo": "2025-26" },
          { "nombre": "Pedri", "asistencias": 8, "partidos": 32, "periodo": "2025-26" },
          { "nombre": "Robert Lewandowski", "asistencias": 7, "partidos": 42, "periodo": "2025-26" },
          { "nombre": "Fermín López", "asistencias": 5, "partidos": 38, "periodo": "2025-26" }
        ]
      }
    }
  }
};