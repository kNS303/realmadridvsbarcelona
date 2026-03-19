/**
 * Tables - Generación dinámica de tablas de jugadores
 */

/**
 * Crea una tabla de jugadores (goleadores o asistentes)
 * @param {string} containerId - ID del contenedor
 * @param {Array} players - Array de jugadores
 * @param {string} statKey - 'goles' o 'asistencias'
 * @param {string} team - 'rm' o 'fcb'
 */
function createPlayerTable(containerId, players, statKey, team) {
    const container = document.getElementById(containerId);
    if (!container || !players) return;

    const statLabel = statKey === 'goles' ? 'Goles' : 'Asist.';
    const maxStat = Math.max(...players.map(p => p[statKey]));
    const colorClass = team === 'rm' ? 'rm' : 'fcb';

    let html = `
        <table class="player-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Jugador</th>
                    <th>${statLabel}</th>
                    <th>PJ</th>
                    <th class="player-period-header">Periodo</th>
                    <th class="player-bar-cell"></th>
                </tr>
            </thead>
            <tbody>
    `;

    players.forEach((player, index) => {
        const statValue = player[statKey];
        const barWidth = maxStat > 0 ? (statValue / maxStat) * 100 : 0;
        const ratio = statKey === 'goles'
            ? (statValue / player.partidos).toFixed(2)
            : (statValue / player.partidos).toFixed(2);

        html += `
            <tr>
                <td class="player-rank">${index + 1}</td>
                <td class="player-name">${player.nombre}</td>
                <td class="player-stat ${colorClass}-stat">${statValue}</td>
                <td class="player-matches">${player.partidos}</td>
                <td class="player-period">${player.periodo}</td>
                <td class="player-bar-cell">
                    <div class="player-bar ${colorClass}-bar" data-width="${barWidth.toFixed(1)}"></div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}