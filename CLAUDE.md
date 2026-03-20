# Dashboard Real Madrid vs FC Barcelona

## Proyecto
Dashboard comparativo de estadisticas historicas y de temporada actual entre Real Madrid y FC Barcelona.
Desplegado en: https://kns303.github.io/realmadridvsbarcelona/

## Stack
- HTML + CSS + JS vanilla (sin frameworks)
- Chart.js 4.4.0 via CDN
- GitHub Pages (deploy automatico via workflow en cada push a main)
- GitHub Actions cron para actualizacion semanal de datos (martes 06:00 UTC)

## Estructura
```
index.html          - Estructura principal (6 secciones + nav + footer)
css/styles.css      - Tema oscuro, responsive, animaciones
js/data.js          - DataService + STATS_DATA embebidos (historico + temporada actual)
js/app.js           - Orquestador: lazy charts, toggle, navegacion, render
js/charts.js        - ChartFactory (8 metodos, Chart.js)
js/animations.js    - Contadores, scroll animations, barras comparativas
js/tables.js        - Tablas dinamicas de jugadores
data/stats.json     - Datos JSON (usado por script de actualizacion)
scripts/update-stats.js - Scraper para actualizacion automatica
.github/workflows/  - deploy.yml + update-stats.yml
```

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
