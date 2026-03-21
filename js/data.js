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
    "lastUpdated": "2026-03-21",
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
      "tarjetasAmarillas": 7186,
      "tarjetasRojas": 417,
      "corners": 27952,
      "faltas": 34827,
      "fuerasDeJuego": 11849,
      "posesionMedia": 53.4,
      "tirosAPuerta": 44719,
      "tirosAFuera": 37862
    },
    "barcelona": {
      "penaltisAFavor": 1793,
      "penaltisEnContra": 1042,
      "tarjetasAmarillas": 6874,
      "tarjetasRojas": 384,
      "corners": 29418,
      "faltas": 32764,
      "fuerasDeJuego": 11295,
      "posesionMedia": 57.8,
      "tirosAPuerta": 43898,
      "tirosAFuera": 36730
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
      "rival": "Man City",
      "golesLocal": 1,
      "golesVisitante": 2,
      "esLocal": false,
      "competicion": "Champions League",
      "fecha": "2026-03-17",
      "resultado": "victoria"
    },
    "barcelona": {
      "rival": "Newcastle",
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
      "nota": "Datos de la temporada 2025-26 en todas las competiciones. Actualizado automaticamente."
    },
    "heroStats": {
      "clasicosDisputados": 1,
      "golesEnClasicos": 3,
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
        "supercopaEspana": 0,
        "supercopaEuropa": 0,
        "mundialClubes": 0,
        "copaLiga": 0,
        "recopa": 0
      }
    },
    "historialGeneral": {
      "realMadrid": {
        "partidosJugados": 40,
        "ganados": 30,
        "empatados": 3,
        "perdidos": 7,
        "golesAFavor": 89,
        "golesEnContra": 38
      },
      "barcelona": {
        "partidosJugados": 38,
        "ganados": 29,
        "empatados": 3,
        "perdidos": 6,
        "golesAFavor": 107,
        "golesEnContra": 45
      }
    },
    "elClasico": {
      "totalPartidos": 1,
      "victoriasRealMadrid": 1,
      "victoriasBarcelona": 0,
      "empates": 0,
      "golesRealMadrid": 2,
      "golesBarcelona": 1,
      "partidos": [
        {
          "fecha": "26 de octubre de 2025",
          "competicion": "La Liga",
          "resultado": "Real Madrid 2-1 FC Barcelona",
          "goleadores": ""
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
          "partidos": 0,
          "rmVictorias": 0,
          "fcbVictorias": 0,
          "empates": 0
        }
      },
      "evolucionHistorica": []
    },
    "estadisticasDetalladas": {
      "realMadrid": {
        "penaltisAFavor": 13,
        "penaltisEnContra": 7,
        "tarjetasAmarillas": 103,
        "tarjetasRojas": 5,
        "corners": 238,
        "faltas": 390,
        "fuerasDeJuego": 86,
        "posesionMedia": 55,
        "tirosAPuerta": 295,
        "tirosAFuera": 258
      },
      "barcelona": {
        "penaltisAFavor": 12,
        "penaltisEnContra": 7,
        "tarjetasAmarillas": 98,
        "tarjetasRojas": 5,
        "corners": 226,
        "faltas": 371,
        "fuerasDeJuego": 82,
        "posesionMedia": 55,
        "tirosAPuerta": 281,
        "tirosAFuera": 245
      }
    },
    "topJugadores": {
      "goleadores": {
        "realMadrid": [
          {
            "nombre": "Kylian Mbappé",
            "goles": 36,
            "partidos": 33,
            "periodo": "2025-26"
          },
          {
            "nombre": "Vinicius Junior",
            "goles": 14,
            "partidos": 38,
            "periodo": "2025-26"
          },
          {
            "nombre": "Federico Valverde",
            "goles": 6,
            "partidos": 38,
            "periodo": "2025-26"
          },
          {
            "nombre": "Arda Guler",
            "goles": 4,
            "partidos": 27,
            "periodo": "2025-26"
          },
          {
            "nombre": "Jude Bellingham",
            "goles": 4,
            "partidos": 17,
            "periodo": "2025-26"
          }
        ],
        "barcelona": [
          {
            "nombre": "Lamine Yamal",
            "goles": 19,
            "partidos": 32,
            "periodo": "2025-26"
          },
          {
            "nombre": "Robert Lewandowski",
            "goles": 15,
            "partidos": 34,
            "periodo": "2025-26"
          },
          {
            "nombre": "Raphinha",
            "goles": 14,
            "partidos": 27,
            "periodo": "2025-26"
          },
          {
            "nombre": "Ferrán Torres",
            "goles": 12,
            "partidos": 26,
            "periodo": "2025-26"
          },
          {
            "nombre": "Fermín López",
            "goles": 11,
            "partidos": 32,
            "periodo": "2025-26"
          }
        ]
      },
      "asistentes": {
        "realMadrid": [
          {
            "nombre": "Vinicius Junior",
            "asistencias": 10,
            "partidos": 38,
            "periodo": "2025-26"
          },
          {
            "nombre": "Federico Valverde",
            "asistencias": 9,
            "partidos": 38,
            "periodo": "2025-26"
          },
          {
            "nombre": "Arda Guler",
            "asistencias": 8,
            "partidos": 27,
            "periodo": "2025-26"
          },
          {
            "nombre": "Kylian Mbappé",
            "asistencias": 5,
            "partidos": 33,
            "periodo": "2025-26"
          },
          {
            "nombre": "Jude Bellingham",
            "asistencias": 3,
            "partidos": 17,
            "periodo": "2025-26"
          }
        ],
        "barcelona": [
          {
            "nombre": "Lamine Yamal",
            "asistencias": 12,
            "partidos": 32,
            "periodo": "2025-26"
          },
          {
            "nombre": "Fermín López",
            "asistencias": 12,
            "partidos": 32,
            "periodo": "2025-26"
          },
          {
            "nombre": "Marcus Rashford",
            "asistencias": 9,
            "partidos": 36,
            "periodo": "2025-26"
          },
          {
            "nombre": "Dani Olmo",
            "asistencias": 7,
            "partidos": 23,
            "periodo": "2025-26"
          },
          {
            "nombre": "Pedri",
            "asistencias": 7,
            "partidos": 20,
            "periodo": "2025-26"
          }
        ]
      }
    }
  },
  "historicalBaseline": {
    "temporada": "2025-26",
    "historialGeneral": {
      "realMadrid": {
        "partidosJugados": 4810,
        "ganados": 2680,
        "empatados": 907,
        "perdidos": 1223,
        "golesAFavor": 9161,
        "golesEnContra": 5482
      },
      "barcelona": {
        "partidosJugados": 4742,
        "ganados": 2651,
        "empatados": 887,
        "perdidos": 1204,
        "golesAFavor": 9043,
        "golesEnContra": 5335
      }
    },
    "estadisticasDetalladas": {
      "realMadrid": {
        "penaltisAFavor": 1834,
        "penaltisEnContra": 1086,
        "tarjetasAmarillas": 7083,
        "tarjetasRojas": 412,
        "corners": 27714,
        "faltas": 34437,
        "fuerasDeJuego": 11763,
        "posesionMedia": 53.4,
        "tirosAPuerta": 44424,
        "tirosAFuera": 37604
      },
      "barcelona": {
        "penaltisAFavor": 1781,
        "penaltisEnContra": 1035,
        "tarjetasAmarillas": 6776,
        "tarjetasRojas": 379,
        "corners": 29192,
        "faltas": 32393,
        "fuerasDeJuego": 11213,
        "posesionMedia": 57.8,
        "tirosAPuerta": 43617,
        "tirosAFuera": 36485
      }
    },
    "elClasico": {
      "totalPartidos": 256,
      "victoriasRealMadrid": 104,
      "victoriasBarcelona": 100,
      "empates": 52,
      "golesRealMadrid": 418,
      "golesBarcelona": 402,
      "porCompeticion": {
        "liga": {
          "partidos": 185,
          "rmVictorias": 75,
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
      }
    }
  }
};