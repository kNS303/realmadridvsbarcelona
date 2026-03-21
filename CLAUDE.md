# Dashboard Real Madrid vs FC Barcelona

## Proyecto
Dashboard comparativo de estadisticas historicas y de temporada actual entre Real Madrid y FC Barcelona.
Desplegado en: https://kns303.github.io/realmadridvsbarcelona/

## Stack
- HTML + CSS + JS vanilla (sin frameworks)
- Chart.js 4.4.0 via CDN
- GitHub Pages (deploy automatico via workflow en cada push a main)
- GitHub Actions cron diario para actualizacion de datos (06:00 UTC / 08:00 ESP)
- API: football-data.org (free tier, 10 req/min, secret: FOOTBALL_API_KEY)

## Estructura
```
index.html              - Estructura principal (6 secciones + nav + footer)
css/styles.css          - Tema Apple Dark, responsive, animaciones
js/data.js              - DataService + STATS_DATA embebidos (historico + temporada actual)
js/app.js               - Orquestador: lazy charts, toggle, navegacion, render
js/charts.js            - ChartFactory (8 metodos, Chart.js)
js/animations.js        - Contadores, scroll animations, barras comparativas
js/tables.js            - Tablas dinamicas de jugadores
data/stats.json         - Datos JSON (historico + baseline + temporada actual)
scripts/update-stats.js - Script de actualizacion v3.0 (API + Wikipedia + acumulacion)
.github/workflows/      - deploy.yml + update-stats.yml
```

## Diseno
- Estetica Apple Dark: elegante, minimalista, sin blancos
- Tipografia: DM Sans (cuerpo/titulos) + DM Mono (numeros/stats)
- Paleta: fondo #0c0c0e/#111113/#1c1c1e, gold #D4A012, garnet #9B1B4D
- Textura noise sutil en body, glassmorphism ligero
- Checkpoint de diseno anterior: tag git `checkpoint-pre-redesign`

## Sistema de actualizacion de datos
- Script v3.0 con sistema de acumulacion historica
- `historicalBaseline`: snapshot pre-temporada almacenado en stats.json
- Cada update: historico_mostrado = baseline + temporada_actual
- Rollover automatico al detectar nueva temporada (agosto)
- Validacion cruzada con clasificacion de La Liga (standings API)
- Wikipedia: actualiza titulos y baseline del Clasico (con sanity checks)
- Indicador verde en nav con fecha de ultima actualizacion
- Limitaciones: assists y stats detallados por partido no disponibles en tier gratuito

## Convenciones
- Comunicacion siempre en espanol
- No usar emojis en la interfaz de la app
- Datos deben estar sincronizados entre js/data.js y data/stats.json
- Verificar responsive en mobile (375px, 480px, 768px) antes de push
- Push dispara deploy automatico a GitHub Pages
- Git: user.name=kNS303, email=kNS303@users.noreply.github.com

## Tareas pendientes
Si hay tareas pendientes de una sesion anterior, estaran en `PENDING_TASKS.md` en la raiz del proyecto.
Al iniciar una nueva sesion, comprobar si existe ese archivo y ejecutar las tareas listadas.
Una vez completadas, eliminar el archivo.
