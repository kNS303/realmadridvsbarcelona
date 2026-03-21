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
- PWA: manifest.json + sw.js (stale-while-revalidate, offline fallback)

## Estructura
```
index.html              - Estructura principal (8 secciones + nav + footer)
css/styles.css          - Tema Apple Dark, responsive, animaciones
js/data.js              - DataService + STATS_DATA embebidos (historico + temporada actual)
js/app.js               - Orquestador: lazy charts, toggle, navegacion, render, comparador
js/charts.js            - ChartFactory (8 metodos, Chart.js)
js/animations.js        - Contadores, scroll animations, barras comparativas
js/tables.js            - Tablas dinamicas de jugadores
data/stats.json         - Datos JSON (historico + baseline + temporada actual + standings)
scripts/update-stats.js - Script de actualizacion v3.0 (API + Wikipedia + acumulacion)
manifest.json           - PWA manifest (theme #0c0c0e, standalone)
sw.js                   - Service worker (cache + offline)
assets/                 - Iconos PWA (SVG + PNG 192/512)
.github/workflows/      - deploy.yml + update-stats.yml
.claude/launch.json     - Config servidor local preview (puerto 3000)
server.js               - Servidor local para desarrollo
```

## Secciones de la app
1. **Hero**: Escudos, VS, ultimo partido, proximo partido, contadores clasicos
2. **Titulos**: Comparativa de titulos por competicion (Liga, Champions, Copa, etc.)
3. **Historial**: Record historico (victorias, empates, derrotas, goles)
4. **El Clasico**: Stats del clasico, tarjetas ultimos 10 clasicos, grafico evolucion por decada
5. **Estadisticas**: Radar chart + barras comparativas detalladas (corners, tarjetas, posesion, etc.)
6. **Jugadores**: Tablas de maximos goleadores y asistentes
7. **Comparador**: Seleccion de jugadores cara a cara con siluetas SVG y barras comparativas
8. **Mini Clasificacion La Liga**: Tabla standings (solo en modo Temporada Actual)

## Diseno
- Estetica Apple Dark: elegante, minimalista, sin blancos
- Tipografia: DM Sans (cuerpo/titulos) + DM Mono (numeros/stats)
- Paleta: fondo #0c0c0e/#111113/#1c1c1e, gold #D4A012, garnet #9B1B4D
- Victoria verde: #34d399, empate gris: #a1a1a6, derrota rojo: #f87171
- Textura noise sutil en body, glassmorphism ligero
- Siluetas SVG de jugadores chutando con equipaciones reales 25-26 (estilo icon lineal flaticon)
- Nav responsive: breakpoint hamburger a 960px, badge verde con fecha+hora
- Checkpoint de diseno anterior: tag git `checkpoint-pre-redesign`

## Sistema de actualizacion de datos
- Script v3.0 con sistema de acumulacion historica
- Cron DIARIO (06:00 UTC / 08:00 ESP) - ejecuta scripts/update-stats.js
- `historicalBaseline`: snapshot pre-temporada almacenado en stats.json
- Cada update: historico_mostrado = baseline + temporada_actual
- Rollover automatico al detectar nueva temporada (agosto)
- Validacion cruzada con clasificacion de La Liga (standings API)
- Wikipedia: actualiza titulos y baseline del Clasico (seccion Honours + Matches summary)
- Deteccion automatica de titulos de temporada (Liga, Champions, Copa del Rey)
- Indicador verde en nav con fecha y hora (hora espanola) de ultima actualizacion
- Datos de standings de La Liga persistidos y actualizados diariamente
- Limitaciones: stats detallados por partido (corners, tarjetas, posesion) no disponibles en tier gratuito
- Asistencias: no disponibles en free tier, se mantienen datos manuales

## Datos de jugadores historicos
- Goleadores y asistentes verificados con fuentes reales (Transfermarkt, BDFutbol, RSSSF)
- Jugadores anteriores a anos 90: asistencias marcadas como null (N/D) porque no se registraban
- El comparador muestra "N/D" con nota explicativa para datos no disponibles
- Datos actuales incluyen: nombre, goles, asistencias (si disponibles), partidos, periodo

## Comparador de jugadores
- Siluetas SVG con equipaciones reales: RM blanco total + FCB blaugrana
- Dropdowns con todos los jugadores (goleadores + asistentes sin duplicados)
- Barras comparativas: Goles, Asistencias, Partidos
- Avatares generados con playerKickSvg() - estilo icon lineal angular
- Nota N/D para asistencias historicas no disponibles

## Tarjetas de ultimos Clasicos
- 10 ultimos clasicos con fecha, competicion, escudos y resultado
- Header: fecha izquierda, competicion derecha (uppercase)
- Escudos oficiales de football-data.org (crests API)
- Borde superior con color del equipo ganador
- Se actualizan automaticamente con el cron diario

## OG Tags y PWA
- Open Graph + Twitter Card meta tags para compartir en redes
- manifest.json con iconos SVG y PNG
- Service worker con cache de assets y offline fallback

## Convenciones
- Comunicacion siempre en espanol
- No usar emojis en la interfaz de la app
- Datos deben estar sincronizados entre js/data.js y data/stats.json
- Verificar responsive en mobile (375px, 480px, 768px, 960px) antes de push
- Push dispara deploy automatico a GitHub Pages
- Git: user.name=kNS303, email=kNS303@users.noreply.github.com

## Tareas programadas (noche 22 marzo 2026)
9 tareas programadas con ejecucion automatica escalonada:
1. 02:15 - Animaciones de scroll (fade-in + slide-up + stagger)
2. 02:45 - Forma reciente VVVED (ultimos 5 partidos en hero)
3. 03:20 - Confetti CSS al ganar titulos de temporada
4. 03:45 - Head-to-head estadisticas en El Clasico (goleadores, rachas, goleadas)
5. 04:25 - Timeline visual de palmares por decada con trofeos SVG
6. 05:10 - Modo claro/oscuro (toggle en nav, dark default, Apple light theme)
7. 06:00 - Compartir comparacion como PNG (html2canvas + Web Share API)
8. 06:40 - Internacionalizacion ES/EN (i18n.js + toggle idioma)
9. 07:40 - Notificaciones proximo Clasico (Notification API + banner cuenta atras)

Cada tarea hace git pull antes y commit+push al terminar. Deben actualizar este CLAUDE.md al completarse.

## Tareas pendientes
Si hay tareas pendientes de una sesion anterior, estaran en `PENDING_TASKS.md` en la raiz del proyecto.
Al iniciar una nueva sesion, comprobar si existe ese archivo y ejecutar las tareas listadas.
Una vez completadas, eliminar el archivo.
