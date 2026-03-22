# Dashboard Real Madrid vs FC Barcelona

## Proyecto
Dashboard comparativo de estadísticas históricas y de temporada actual entre Real Madrid y FC Barcelona.
Desplegado en: https://kns303.github.io/realmadridvsbarcelona/

## Stack
- HTML + CSS + JS vanilla (sin frameworks)
- Chart.js 4.4.0 via CDN
- GitHub Pages (deploy automático via workflow en cada push a main)
- GitHub Actions cron diario para actualización de datos (06:00 UTC / 08:00 ESP)
- API: football-data.org (free tier, 10 req/min, secret: FOOTBALL_API_KEY)
- PWA: manifest.json + sw.js (stale-while-revalidate, offline fallback)

## Estructura
```
index.html              - Estructura principal (8 secciones + nav + footer)
css/styles.css          - Tema Apple Dark, responsive, animaciones
js/data.js              - DataService + STATS_DATA embebidos (histórico + temporada actual)
js/app.js               - Orquestador: lazy charts, toggle, navegación, render, comparador
js/charts.js            - ChartFactory (8 métodos, Chart.js)
js/animations.js        - Contadores, scroll animations, barras comparativas
js/tables.js            - Tablas dinámicas de jugadores
js/i18n.js              - Internacionalización ES/EN (traducciones + toggle idioma)
js/notifications.js     - Notificaciones próximo Clásico (Notification API + banner)
data/stats.json         - Datos JSON (histórico + baseline + temporada actual + standings)
scripts/update-stats.js - Script de actualización v3.0 (API + Wikipedia + acumulación)
manifest.json           - PWA manifest (theme #0c0c0e, standalone)
sw.js                   - Service worker (cache + offline)
assets/                 - Iconos PWA (SVG + PNG 192/512)
.github/workflows/      - deploy.yml + update-stats.yml
.claude/launch.json     - Config servidor local preview (puerto 3000)
server.js               - Servidor local para desarrollo
```

## Secciones de la app
1. **Hero**: Escudos, VS, último partido, próximo partido, contadores clásicos
2. **Títulos**: Comparativa de títulos por competición (Liga, Champions, Copa, etc.) + timeline por década
3. **Historial**: Récord histórico (victorias, empates, derrotas, goles)
4. **El Clásico**: Stats del clásico, tarjetas últimos 10 clásicos, gráfico evolución por década, h2h goleadores
5. **Estadísticas**: Radar chart + barras comparativas detalladas (corners, tarjetas, posesión, etc.)
6. **Jugadores**: Tablas de máximos goleadores y asistentes
7. **Comparador**: Selección de jugadores cara a cara con siluetas SVG y barras comparativas
8. **Mini Clasificación La Liga**: Tabla standings (solo en modo Temporada Actual)

## Diseño
- Estética Apple Dark: elegante, minimalista, sin blancos
- Tipografía: DM Sans (cuerpo/títulos) + DM Mono (números/stats)
- Paleta: fondo #0c0c0e/#111113/#1c1c1e, gold #D4A012, garnet #9B1B4D
- Victoria verde: #34d399, empate gris: #a1a1a6, derrota rojo: #f87171
- Textura noise sutil en body, glassmorphism ligero
- Siluetas SVG de jugadores chutando con equipaciones reales 25-26 (estilo icon lineal flaticon)
- Modo claro/oscuro: toggle en nav (desktop) y dentro del hamburguesa (móvil), dark por defecto
- Checkpoint de diseño anterior: tag git `checkpoint-pre-redesign`

## Navegación responsive
- Breakpoint hamburguesa: 960px
- **Desktop (>960px)**: Logo escudos + banderas idioma + toggle tema + badge verde actualización + links navegación
- **Móvil (<=960px)**: Logo escudos + badge verde actualización + hamburguesa
  - Menú hamburguesa contiene: 6 links de navegación + separador + toggle tema (luna/sol) + banderas idioma
- Toggle idioma: banderas España/UK (en lugar de texto ES/EN), bandera inactiva en gris
- Banner "Próximo Clásico": sticky debajo del nav, una sola línea (sin wrap)

## Sistema de actualización de datos
- Script v3.0 con sistema de acumulación histórica
- Cron DIARIO (06:00 UTC / 08:00 ESP) - ejecuta scripts/update-stats.js
- `historicalBaseline`: snapshot pre-temporada almacenado en stats.json
- Cada update: histórico_mostrado = baseline + temporada_actual
- Rollover automático al detectar nueva temporada (agosto)
- Validación cruzada con clasificación de La Liga (standings API)
- Wikipedia: actualiza títulos y baseline del Clásico (sección Honours + Matches summary)
- Detección automática de títulos de temporada (Liga, Champions, Copa del Rey)
- Indicador verde en nav con fecha y hora (hora española) de última actualización
- Datos de standings de La Liga persistidos y actualizados diariamente
- Limitaciones: stats detallados por partido (corners, tarjetas, posesión) no disponibles en tier gratuito
- Asistencias: no disponibles en free tier, se mantienen datos manuales

## Datos de jugadores históricos
- Goleadores y asistentes verificados con fuentes reales (Transfermarkt, BDFutbol, RSSSF)
- Jugadores anteriores a años 90: asistencias marcadas como null (N/D) porque no se registraban
- El comparador muestra "N/D" con nota explicativa para datos no disponibles
- Datos actuales incluyen: nombre, goles, asistencias (si disponibles), partidos, período

## Comparador de jugadores
- Siluetas SVG con equipaciones reales: RM blanco total + FCB blaugrana
- Dropdowns con todos los jugadores (goleadores + asistentes sin duplicados)
- Barras comparativas: Goles, Asistencias, Partidos
- Avatares generados con playerKickSvg() - estilo icon lineal angular
- Nota N/D para asistencias históricas no disponibles
- Botón compartir como PNG (html2canvas + Web Share API)

## Tarjetas de últimos Clásicos
- 10 últimos clásicos con fecha, competición, escudos y resultado
- Header: fecha izquierda, competición derecha (uppercase)
- Escudos oficiales de football-data.org (crests API)
- Borde superior con color del equipo ganador
- Se actualizan automáticamente con el cron diario

## OG Tags y PWA
- Open Graph + Twitter Card meta tags para compartir en redes
- manifest.json con iconos SVG y PNG
- Service worker con cache de assets y offline fallback

## Internacionalización (i18n)
- js/i18n.js: objeto I18N con traducciones ES/EN + helper i18n.t('clave.subclave')
- Default: español. Detecta navegador inglés automáticamente. Guarda en localStorage('lang')
- Toggle con banderas (España/UK) en nav (desktop) y dentro del hamburguesa (móvil)
- data-i18n="clave" en elementos HTML estáticos; i18n.applyToDOM() los traduce
- Textos dinámicos JS usan i18n.t() directamente (charts, tables, comparador, etc.)
- setLanguage(lang, ...) en app.js reconstruye todos los componentes dinámicos
- NO se traducen nombres propios: Real Madrid, FC Barcelona, jugadores, competiciones oficiales

## Notificaciones próximo Clásico
- Banner sticky con cuenta atrás (días/horas) hasta el próximo Clásico
- Notification API del navegador para recordatorios
- Botón activar/desactivar recordatorio en el banner

## Convenciones
- Comunicación siempre en español
- No usar emojis en la interfaz de la app (excepto banderas de idioma)
- Datos deben estar sincronizados entre js/data.js y data/stats.json
- Verificar responsive en mobile (375px, 480px, 768px, 960px) antes de push
- Push dispara deploy automático a GitHub Pages
- Git: user.name=kNS303, email=kNS303@users.noreply.github.com
- Ortografía: todas las tildes y eñes correctas en textos visibles, traducciones y comentarios

## Tareas completadas (noche 22 marzo 2026)
1. Animaciones de scroll (fade-in + slide-up + stagger)
2. Forma reciente VVVED (últimos 5 partidos en hero)
3. Confetti CSS al ganar títulos de temporada
4. Head-to-head estadísticas en El Clásico (goleadores, rachas, goleadas)
5. Timeline visual de palmarés por década con trofeos SVG
6. Modo claro/oscuro (toggle en nav, dark default, Apple light theme)
7. Compartir comparación como PNG (html2canvas + Web Share API)
8. Internacionalización ES/EN (i18n.js + toggle idioma)
9. Notificaciones próximo Clásico (Notification API + banner cuenta atrás)

## Tareas pendientes
Si hay tareas pendientes de una sesión anterior, estarán en `PENDING_TASKS.md` en la raíz del proyecto.
Al iniciar una nueva sesión, comprobar si existe ese archivo y ejecutar las tareas listadas.
Una vez completadas, eliminar el archivo.
