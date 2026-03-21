/**
 * Script de actualizacion automatica de estadisticas v3.0
 *
 * Fuentes:
 *   - football-data.org (API_KEY requerida): temporada actual completa
 *   - Wikipedia API: datos historicos (titulos, El Clasico)
 *
 * Actualiza AMBAS vistas del dashboard:
 *   - Temporada actual (record, goleadores, clasicos, estadisticas)
 *   - Datos historicos = baseline pre-temporada + acumulado de temporada actual
 *   - Titulos historicos (Wikipedia, absolutos)
 *
 * Sistema de acumulacion:
 *   historicalBaseline: snapshot de datos al inicio de la temporada
 *   Cada update: historialGeneral = baseline + temporadaActual
 *   Rollover automatico al detectar nueva temporada
 *
 * Validacion cruzada:
 *   Contrasta datos de partidos con clasificacion de La Liga (standings)
 *
 * Uso:
 *   API_KEY=tu_key node scripts/update-stats.js
 *   API_KEY=tu_key node scripts/update-stats.js --dry-run
 *
 * Programacion: GitHub Actions cron (martes 06:00 UTC)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '..', 'data', 'stats.json');
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const API_KEY = process.env.API_KEY || null;
const DRY_RUN = process.argv.includes('--dry-run');

// IDs en football-data.org
const TEAM_IDS = { realMadrid: 86, barcelona: 81 };

// Temporada actual (ajustar si cambia de año)
const CURRENT_SEASON = new Date().getMonth() >= 7
    ? new Date().getFullYear()
    : new Date().getFullYear() - 1;

// ============================================================
// Rangos validos para validacion de cordura (historico)
// ============================================================
const SANITY_RANGES = {
    titulos: {
        liga:              { min: 20, max: 50 },
        championsLeague:   { min: 3,  max: 20 },
        copaDelRey:        { min: 15, max: 40 },
        supercopaEspana:   { min: 8,  max: 25 },
        supercopaEuropa:   { min: 3,  max: 15 },
        mundialClubes:     { min: 1,  max: 15 },
        copaLiga:          { min: 0,  max: 5 },
        recopa:            { min: 0,  max: 10 }
    },
    clasico: {
        totalPartidos:        { min: 240, max: 320 },
        victoriasRealMadrid:  { min: 90,  max: 140 },
        victoriasBarcelona:   { min: 85,  max: 140 },
        empates:              { min: 40,  max: 80 }
    }
};

// ============================================================
// Utilidades HTTP (con rate limiting)
// ============================================================

let lastRequestTime = 0;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url, headers = {}) {
    // football-data.org free tier: 10 req/min
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 6500) {
        await delay(6500 - elapsed);
    }
    lastRequestTime = Date.now();
    return fetchURL(url, headers);
}

function fetchURL(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'ElClasicoStats/3.0 (bot; educational)', ...headers } };
        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchURL(res.headers.location, headers).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function fetchJSON(url, headers = {}) {
    return fetchURL(url, headers).then(JSON.parse);
}

async function fetchAPIJSON(url) {
    if (!API_KEY) return null;
    const raw = await rateLimitedFetch(url, { 'X-Auth-Token': API_KEY });
    return JSON.parse(raw);
}

// ============================================================
// Validacion de cordura
// ============================================================

function sanityCheck(value, range, label) {
    if (value === null || value === undefined || isNaN(value)) {
        console.log(`    [RECHAZADO] ${label}: valor invalido (${value})`);
        return false;
    }
    if (value < range.min || value > range.max) {
        console.log(`    [RECHAZADO] ${label}: ${value} fuera de rango [${range.min}-${range.max}]`);
        return false;
    }
    console.log(`    [OK] ${label}: ${value}`);
    return true;
}

// ============================================================
// FUENTE 1: Wikipedia API (datos historicos)
// ============================================================

async function fetchHistoricalFromWikipedia() {
    console.log('\n[WIKIPEDIA] Consultando datos historicos...\n');

    const results = { titulos: { realMadrid: {}, barcelona: {} }, clasico: {} };

    try {
        // Titulos desde secciones de Honours (wikitable format)
        // Real Madrid: section 32 = Honours | FC Barcelona: section 24 = Honours
        const rmHonours = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=Real_Madrid_CF&prop=wikitext&section=32&format=json'
        );
        const fcbHonours = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=FC_Barcelona&prop=wikitext&section=24&format=json'
        );

        const rmText = rmHonours?.parse?.wikitext?.['*'] || '';
        const fcbText = fcbHonours?.parse?.wikitext?.['*'] || '';

        results.titulos.realMadrid = extractHonoursTitles(rmText, 'Real Madrid');
        results.titulos.barcelona = extractHonoursTitles(fcbText, 'Barcelona');

        // El Clasico: infobox (section=0) para total, section=12 para wins/draws
        const clasicoInfData = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=El_Cl%C3%A1sico&prop=wikitext&section=0&format=json'
        );
        const clasicoStatsData = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=El_Cl%C3%A1sico&prop=wikitext&section=12&format=json'
        );

        const clasicoInfText = clasicoInfData?.parse?.wikitext?.['*'] || '';
        const clasicoStatsText = clasicoStatsData?.parse?.wikitext?.['*'] || '';

        // Total desde infobox: "| total = 263 (official matches)"
        const totalMatch = clasicoInfText.match(/\|\s*total\s*=\s*(\d+)/i);
        if (totalMatch) results.clasico.totalPartidos = parseInt(totalMatch[1]);

        // Wins/draws desde tabla de Matches summary (section 12):
        // "! scope="row" | All competitions\n! 263|| 106|| 105||52||..."
        const summaryMatch = clasicoStatsText.match(
            /All competitions[\s\S]*?!\s*(\d+)\s*\|\|\s*(\d+)\s*\|\|\s*(\d+)\s*\|\|\s*(\d+)/i
        );
        if (summaryMatch) {
            results.clasico.victoriasRealMadrid = parseInt(summaryMatch[2]);
            results.clasico.victoriasBarcelona  = parseInt(summaryMatch[3]);
            results.clasico.empates             = parseInt(summaryMatch[4]);
        }

        console.log('  Clasico extraido:', JSON.stringify(results.clasico));
    } catch (err) {
        console.warn('  [ERROR] Wikipedia:', err.message);
    }

    return results;
}

/**
 * Extrae titulos de la seccion Honours (wikitable) de Wikipedia.
 * Formato de la tabla (linea de competicion seguida de linea con el numero):
 *   ! scope="col" | [[La Liga]]<ref...>
 *   | style="background-color:gold" | '''36'''
 * o bien (FCB):
 *   ! scope=col|[[La Liga]]<ref...>
 *   |align="center"|28
 */
function extractHonoursTitles(wikitext, teamLabel) {
    const titles = {};
    const lines = wikitext.split('\n');

    function extractCount(substring) {
        for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i].indexOf(substring) === -1) continue;
            // Find the next line that starts with '|' (data row)
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const dataLine = lines[j].trim();
                if (!dataLine.startsWith('|')) continue;
                // Prefer bold number: '''N'''
                const boldMatch = dataLine.match(/'''(\d+)'''/);
                if (boldMatch) return parseInt(boldMatch[1]);
                // Fallback: last |N on the line
                const pipeNums = [...dataLine.matchAll(/\|(\d+)/g)];
                if (pipeNums.length) return parseInt(pipeNums[pipeNums.length - 1][1]);
                // Last resort: first standalone number
                const numMatch = dataLine.match(/\b(\d+)\b/);
                return numMatch ? parseInt(numMatch[1]) : null;
            }
        }
        return null;
    }

    const liga = extractCount('[[La Liga');
    if (liga !== null) titles.liga = liga;

    const cl = extractCount('[[UEFA Champions League');
    if (cl !== null) titles.championsLeague = cl;

    const copa = extractCount('[[Copa del Rey');
    if (copa !== null) titles.copaDelRey = copa;

    const supercopa = extractCount('[[Supercopa de Espa');
    if (supercopa !== null) titles.supercopaEspana = supercopa;

    console.log(`  ${teamLabel} honours:`, JSON.stringify(titles));
    return titles;
}

// ============================================================
// FUENTE 2: football-data.org (temporada actual COMPLETA)
// ============================================================

/**
 * Obtiene TODOS los partidos finalizados de un equipo en la temporada actual
 */
async function fetchTeamMatches(teamId, teamName) {
    console.log(`\n[API] Obteniendo partidos de ${teamName} (temporada ${CURRENT_SEASON})...`);

    try {
        const data = await fetchAPIJSON(
            `https://api.football-data.org/v4/teams/${teamId}/matches?season=${CURRENT_SEASON}&status=FINISHED`
        );
        if (!data || !data.matches) return null;

        const matches = data.matches;
        console.log(`  ${matches.length} partidos encontrados`);
        return matches;
    } catch (err) {
        console.warn(`  [ERROR] ${teamName}:`, err.message);
        return null;
    }
}

/**
 * Computa el record de la temporada a partir de los partidos
 */
function computeSeasonRecord(matches, teamId) {
    let ganados = 0, empatados = 0, perdidos = 0;
    let golesAFavor = 0, golesEnContra = 0;

    for (const match of matches) {
        const esLocal = match.homeTeam.id === teamId;
        const gf = esLocal ? match.score.fullTime.home : match.score.fullTime.away;
        const gc = esLocal ? match.score.fullTime.away : match.score.fullTime.home;

        if (gf === null || gc === null) continue;

        golesAFavor += gf;
        golesEnContra += gc;

        if (gf > gc) ganados++;
        else if (gf === gc) empatados++;
        else perdidos++;
    }

    return {
        partidosJugados: ganados + empatados + perdidos,
        ganados, empatados, perdidos,
        golesAFavor, golesEnContra
    };
}

/**
 * Filtra los Clasicos (RM vs FCB) de la temporada
 */
function extractSeasonClasicos(rmMatches, fcbMatches) {
    if (!rmMatches) return null;

    const clasicos = rmMatches.filter(m =>
        m.homeTeam.id === TEAM_IDS.barcelona || m.awayTeam.id === TEAM_IDS.barcelona
    );

    if (clasicos.length === 0) return null;

    let rmVictorias = 0, fcbVictorias = 0, empates = 0;
    let golesRM = 0, golesFCB = 0;
    const partidos = [];

    // Mapear codigos de competicion
    const compMap = {
        'PD': 'La Liga', 'CL': 'Champions League',
        'CDR': 'Copa del Rey', 'SA': 'Supercopa de Espana',
        'FL1': 'Ligue 1', 'EC': 'Copa de Europa'
    };

    const porComp = {
        liga: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
        copaDelRey: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
        championsLeague: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
        supercopa: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 }
    };

    for (const m of clasicos) {
        const rmEsLocal = m.homeTeam.id === TEAM_IDS.realMadrid;
        const gRM = rmEsLocal ? m.score.fullTime.home : m.score.fullTime.away;
        const gFCB = rmEsLocal ? m.score.fullTime.away : m.score.fullTime.home;

        if (gRM === null || gFCB === null) continue;

        golesRM += gRM;
        golesFCB += gFCB;

        let resultado;
        if (gRM > gFCB) { rmVictorias++; resultado = 'rm'; }
        else if (gFCB > gRM) { fcbVictorias++; resultado = 'fcb'; }
        else { empates++; resultado = 'empate'; }

        // Competicion
        const compCode = m.competition.code;
        const compName = compMap[compCode] || m.competition.name;

        // Mapear a porCompeticion
        let compKey = 'liga';
        if (compCode === 'CDR') compKey = 'copaDelRey';
        else if (compCode === 'CL') compKey = 'championsLeague';
        else if (compCode === 'SA' || compName.includes('Supercopa')) compKey = 'supercopa';

        if (porComp[compKey]) {
            porComp[compKey].partidos++;
            if (resultado === 'rm') porComp[compKey].rmVictorias++;
            else if (resultado === 'fcb') porComp[compKey].fcbVictorias++;
            else porComp[compKey].empates++;
        }

        // Score string
        const scoreStr = rmEsLocal
            ? `Real Madrid ${gRM}-${gFCB} FC Barcelona`
            : `FC Barcelona ${gFCB}-${gRM} Real Madrid`;

        const fecha = new Date(m.utcDate);
        const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

        partidos.push({
            fecha: fechaStr,
            competicion: compName,
            resultado: scoreStr,
            goleadores: '' // football-data.org no da goleadores individuales
        });
    }

    return {
        totalPartidos: clasicos.length,
        victoriasRealMadrid: rmVictorias,
        victoriasBarcelona: fcbVictorias,
        empates,
        golesRealMadrid: golesRM,
        golesBarcelona: golesFCB,
        partidos,
        porCompeticion: porComp,
        evolucionHistorica: []
    };
}

/**
 * Obtiene el ultimo partido de un equipo
 */
function extractLastMatch(matches, teamId) {
    if (!matches || matches.length === 0) return null;

    // Ordenar por fecha descendente
    const sorted = [...matches].sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
    const match = sorted[0];

    const esLocal = match.homeTeam.id === teamId;
    const rival = esLocal
        ? (match.awayTeam.shortName || match.awayTeam.name)
        : (match.homeTeam.shortName || match.homeTeam.name);
    const golesLocal = match.score.fullTime.home;
    const golesVisitante = match.score.fullTime.away;
    const golesEquipo = esLocal ? golesLocal : golesVisitante;
    const golesRival = esLocal ? golesVisitante : golesLocal;

    let resultado;
    if (golesEquipo > golesRival) resultado = 'victoria';
    else if (golesEquipo < golesRival) resultado = 'derrota';
    else resultado = 'empate';

    const compMap = {
        'PD': 'La Liga', 'CL': 'Champions League',
        'CDR': 'Copa del Rey', 'SA': 'Supercopa'
    };

    return {
        rival,
        golesLocal,
        golesVisitante,
        esLocal,
        competicion: compMap[match.competition.code] || match.competition.name,
        fecha: match.utcDate.split('T')[0],
        resultado
    };
}

/**
 * Obtiene top goleadores/asistentes de una competicion
 */
async function fetchCompetitionScorers(compCode, compName) {
    console.log(`\n[API] Obteniendo goleadores/asistentes de ${compName}...`);

    try {
        const data = await fetchAPIJSON(
            `https://api.football-data.org/v4/competitions/${compCode}/scorers?season=${CURRENT_SEASON}&limit=100`
        );
        if (!data || !data.scorers) return [];

        console.log(`  ${data.scorers.length} jugadores encontrados`);
        return data.scorers;
    } catch (err) {
        console.warn(`  [ERROR] Goleadores ${compName}:`, err.message);
        return [];
    }
}

/**
 * Construye los top 5 goleadores Y top 5 asistentes de cada equipo
 * desde multiples competiciones
 */
function buildTopPlayersStats(scorersByComp) {
    // Merge players from all competitions
    const playerMap = {}; // key: teamId-playerName

    for (const scorers of scorersByComp) {
        for (const s of scorers) {
            const key = `${s.team.id}-${s.player.name}`;

            if (!playerMap[key]) {
                playerMap[key] = {
                    nombre: s.player.name,
                    teamId: s.team.id,
                    goles: 0,
                    asistencias: 0,
                    partidos: 0
                };
            }
            playerMap[key].goles += s.goals || 0;
            playerMap[key].asistencias += s.assists || 0;
            playerMap[key].partidos += s.playedMatches || 0;
        }
    }

    const season = `${CURRENT_SEASON}-${(CURRENT_SEASON + 1).toString().slice(2)}`;

    const result = {
        goleadores: { realMadrid: [], barcelona: [] },
        asistentes: { realMadrid: [], barcelona: [] }
    };

    for (const [teamKey, teamId] of Object.entries(TEAM_IDS)) {
        const teamPlayers = Object.values(playerMap).filter(p => p.teamId === teamId);

        // Top 5 goleadores (solo los que tienen al menos 1 gol)
        result.goleadores[teamKey] = teamPlayers
            .filter(p => p.goles > 0)
            .sort((a, b) => b.goles - a.goles)
            .slice(0, 5)
            .map(p => ({
                nombre: p.nombre,
                goles: p.goles,
                partidos: p.partidos,
                periodo: season
            }));

        // Top 5 asistentes (solo los que tienen al menos 1 asistencia)
        result.asistentes[teamKey] = teamPlayers
            .filter(p => p.asistencias > 0)
            .sort((a, b) => b.asistencias - a.asistencias)
            .slice(0, 5)
            .map(p => ({
                nombre: p.nombre,
                asistencias: p.asistencias,
                partidos: p.partidos,
                periodo: season
            }));
    }

    return result;
}

/**
 * Estima estadisticas detalladas de la temporada basandose en partidos jugados
 * Usa promedios tipicos de La Liga cuando no hay datos de la API
 */
function estimateDetailedStats(record, existingStats) {
    // Si ya tenemos stats existentes y los partidos no han cambiado mucho, mantener
    if (existingStats && existingStats.penaltisAFavor !== undefined) {
        // Escalar stats existentes proporcionalmente a los nuevos partidos
        const oldGames = Object.values(existingStats).length > 0
            ? Math.round(existingStats.corners / 6) // ~6 corners/partido
            : record.partidosJugados;

        if (oldGames === record.partidosJugados) {
            return existingStats; // Sin cambios
        }

        // Escalar proporcionalmente
        const ratio = record.partidosJugados / Math.max(oldGames, 1);
        return {
            penaltisAFavor: Math.round(existingStats.penaltisAFavor * ratio),
            penaltisEnContra: Math.round(existingStats.penaltisEnContra * ratio),
            tarjetasAmarillas: Math.round(existingStats.tarjetasAmarillas * ratio),
            tarjetasRojas: Math.round(existingStats.tarjetasRojas * ratio),
            corners: Math.round(existingStats.corners * ratio),
            faltas: Math.round(existingStats.faltas * ratio),
            fuerasDeJuego: Math.round(existingStats.fuerasDeJuego * ratio),
            posesionMedia: existingStats.posesionMedia, // No escalar porcentaje
            tirosAPuerta: Math.round(existingStats.tirosAPuerta * ratio),
            tirosAFuera: Math.round(existingStats.tirosAFuera * ratio)
        };
    }

    // Fallback: estimar con promedios tipicos de La Liga
    const pj = record.partidosJugados;
    return {
        penaltisAFavor: Math.round(pj * 0.32),
        penaltisEnContra: Math.round(pj * 0.18),
        tarjetasAmarillas: Math.round(pj * 2.5),
        tarjetasRojas: Math.round(pj * 0.12),
        corners: Math.round(pj * 5.8),
        faltas: Math.round(pj * 9.5),
        fuerasDeJuego: Math.round(pj * 2.1),
        posesionMedia: 55.0,
        tirosAPuerta: Math.round(pj * 7.2),
        tirosAFuera: Math.round(pj * 6.3)
    };
}

/**
 * Obtiene la clasificacion de La Liga
 */
async function fetchStandings() {
    console.log('\n[API] Obteniendo clasificacion de La Liga...');

    try {
        const data = await fetchAPIJSON(
            `https://api.football-data.org/v4/competitions/PD/standings?season=${CURRENT_SEASON}`
        );
        if (!data || !data.standings) return null;

        const table = data.standings[0]?.table || [];
        const rm = table.find(t => t.team.id === TEAM_IDS.realMadrid);
        const fcb = table.find(t => t.team.id === TEAM_IDS.barcelona);

        console.log(`  RM: ${rm ? rm.position + 'o, ' + rm.points + ' pts' : 'no encontrado'}`);
        console.log(`  FCB: ${fcb ? fcb.position + 'o, ' + fcb.points + ' pts' : 'no encontrado'}`);

        return { realMadrid: rm, barcelona: fcb };
    } catch (err) {
        console.warn('  [ERROR] Clasificacion:', err.message);
        return null;
    }
}

// ============================================================
// ORQUESTADOR: construir temporadaActual completa
// ============================================================

async function buildSeasonData(existing) {
    if (!API_KEY) {
        console.log('\n[AVISO] API_KEY no configurada. Para actualizar la temporada actual:');
        console.log('  1. Registrate gratis en https://www.football-data.org/');
        console.log('  2. Ejecuta: API_KEY=tu_key node scripts/update-stats.js');
        console.log('  3. O configura el secret FOOTBALL_API_KEY en GitHub\n');
        return null;
    }

    console.log('\n========================================');
    console.log('  ACTUALIZACION DE TEMPORADA ACTUAL');
    console.log('========================================');

    // 1. Obtener todos los partidos de ambos equipos
    const rmMatches = await fetchTeamMatches(TEAM_IDS.realMadrid, 'Real Madrid');
    const fcbMatches = await fetchTeamMatches(TEAM_IDS.barcelona, 'FC Barcelona');

    if (!rmMatches && !fcbMatches) {
        console.log('\n  [AVISO] No se pudieron obtener partidos. Manteniendo datos actuales.');
        return null;
    }

    const season = `${CURRENT_SEASON}-${(CURRENT_SEASON + 1).toString().slice(2)}`;
    const existingSeason = existing.temporadaActual || {};

    // 2. Computar record de temporada
    const rmRecord = rmMatches ? computeSeasonRecord(rmMatches, TEAM_IDS.realMadrid) : null;
    const fcbRecord = fcbMatches ? computeSeasonRecord(fcbMatches, TEAM_IDS.barcelona) : null;

    console.log('\n[RECORD]');
    if (rmRecord) console.log(`  RM: ${rmRecord.partidosJugados}PJ ${rmRecord.ganados}G ${rmRecord.empatados}E ${rmRecord.perdidos}P (${rmRecord.golesAFavor}-${rmRecord.golesEnContra})`);
    if (fcbRecord) console.log(`  FCB: ${fcbRecord.partidosJugados}PJ ${fcbRecord.ganados}G ${fcbRecord.empatados}E ${fcbRecord.perdidos}P (${fcbRecord.golesAFavor}-${fcbRecord.golesEnContra})`);

    // 3. Extraer Clasicos de la temporada
    const seasonClasicos = extractSeasonClasicos(rmMatches, fcbMatches);
    if (seasonClasicos) {
        console.log(`\n[CLASICOS] ${seasonClasicos.totalPartidos} clasicos esta temporada`);
    }

    // 4. Ultimo partido
    const ultimoRM = rmMatches ? extractLastMatch(rmMatches, TEAM_IDS.realMadrid) : null;
    const ultimoFCB = fcbMatches ? extractLastMatch(fcbMatches, TEAM_IDS.barcelona) : null;

    if (ultimoRM) console.log(`\n[ULTIMO] RM: vs ${ultimoRM.rival} (${ultimoRM.golesLocal}-${ultimoRM.golesVisitante}) ${ultimoRM.competicion}`);
    if (ultimoFCB) console.log(`[ULTIMO] FCB: vs ${ultimoFCB.rival} (${ultimoFCB.golesLocal}-${ultimoFCB.golesVisitante}) ${ultimoFCB.competicion}`);

    // 5. Validacion cruzada con clasificacion de La Liga
    const standings = await fetchStandings();
    if (standings && rmMatches) {
        console.log('\n[VALIDACION] Contrastando datos con clasificacion de La Liga...');

        const rmLaLiga = rmMatches.filter(m => m.competition.code === 'PD');
        const fcbLaLiga = fcbMatches ? fcbMatches.filter(m => m.competition.code === 'PD') : [];

        if (standings.realMadrid && rmLaLiga.length > 0) {
            const rmLigaRecord = computeSeasonRecord(rmLaLiga, TEAM_IDS.realMadrid);
            const s = standings.realMadrid;
            const ptsCalc = rmLigaRecord.ganados * 3 + rmLigaRecord.empatados;
            console.log(`  RM Liga: ${rmLigaRecord.partidosJugados}PJ ${rmLigaRecord.ganados}G ${rmLigaRecord.empatados}E ${rmLigaRecord.perdidos}P | Pts: ${ptsCalc}`);
            console.log(`  RM Standings: ${s.playedGames}PJ ${s.won}G ${s.draw}E ${s.lost}P | Pts: ${s.points}`);
            if (rmLigaRecord.partidosJugados !== s.playedGames) {
                console.warn(`  [DISCREPANCIA] RM partidos: API=${rmLigaRecord.partidosJugados} vs standings=${s.playedGames}`);
            }
            if (ptsCalc !== s.points) {
                console.warn(`  [DISCREPANCIA] RM puntos: calculado=${ptsCalc} vs standings=${s.points}`);
            }
            if (rmLigaRecord.golesAFavor !== s.goalsFor) {
                console.warn(`  [DISCREPANCIA] RM goles a favor: API=${rmLigaRecord.golesAFavor} vs standings=${s.goalsFor}`);
            }
        }

        if (standings.barcelona && fcbLaLiga.length > 0) {
            const fcbLigaRecord = computeSeasonRecord(fcbLaLiga, TEAM_IDS.barcelona);
            const s = standings.barcelona;
            const ptsCalc = fcbLigaRecord.ganados * 3 + fcbLigaRecord.empatados;
            console.log(`  FCB Liga: ${fcbLigaRecord.partidosJugados}PJ ${fcbLigaRecord.ganados}G ${fcbLigaRecord.empatados}E ${fcbLigaRecord.perdidos}P | Pts: ${ptsCalc}`);
            console.log(`  FCB Standings: ${s.playedGames}PJ ${s.won}G ${s.draw}E ${s.lost}P | Pts: ${s.points}`);
            if (fcbLigaRecord.partidosJugados !== s.playedGames) {
                console.warn(`  [DISCREPANCIA] FCB partidos: API=${fcbLigaRecord.partidosJugados} vs standings=${s.playedGames}`);
            }
            if (ptsCalc !== s.points) {
                console.warn(`  [DISCREPANCIA] FCB puntos: calculado=${ptsCalc} vs standings=${s.points}`);
            }
            if (fcbLigaRecord.golesAFavor !== s.goalsFor) {
                console.warn(`  [DISCREPANCIA] FCB goles a favor: API=${fcbLigaRecord.golesAFavor} vs standings=${s.goalsFor}`);
            }
        }
    }

    // 6. Top goleadores y asistentes (La Liga + Champions)
    const laLigaScorers = await fetchCompetitionScorers('PD', 'La Liga');
    const clScorers = await fetchCompetitionScorers('CL', 'Champions League');
    const topStats = buildTopPlayersStats([laLigaScorers, clScorers]);

    console.log('\n[GOLEADORES]');
    if (topStats.goleadores.realMadrid.length) {
        console.log(`  RM top: ${topStats.goleadores.realMadrid[0].nombre} (${topStats.goleadores.realMadrid[0].goles} goles)`);
        console.log(`  RM total: ${topStats.goleadores.realMadrid.length} jugadores`);
    }
    if (topStats.goleadores.barcelona.length) {
        console.log(`  FCB top: ${topStats.goleadores.barcelona[0].nombre} (${topStats.goleadores.barcelona[0].goles} goles)`);
        console.log(`  FCB total: ${topStats.goleadores.barcelona.length} jugadores`);
    }
    console.log('\n[ASISTENTES]');
    if (topStats.asistentes.realMadrid.length) {
        console.log(`  RM top: ${topStats.asistentes.realMadrid[0].nombre} (${topStats.asistentes.realMadrid[0].asistencias} asist.)`);
    }
    if (topStats.asistentes.barcelona.length) {
        console.log(`  FCB top: ${topStats.asistentes.barcelona[0].nombre} (${topStats.asistentes.barcelona[0].asistencias} asist.)`);
    }

    // 7. Estadisticas detalladas (estimadas/escaladas)
    const existingDetailedRM = existingSeason.estadisticasDetalladas?.realMadrid;
    const existingDetailedFCB = existingSeason.estadisticasDetalladas?.barcelona;

    const statsRM = rmRecord ? estimateDetailedStats(rmRecord, existingDetailedRM) : existingDetailedRM;
    const statsFCB = fcbRecord ? estimateDetailedStats(fcbRecord, existingDetailedFCB) : existingDetailedFCB;

    // 8. Hero stats
    const clasicosDisputados = seasonClasicos ? seasonClasicos.totalPartidos : (existingSeason.heroStats?.clasicosDisputados || 0);
    const golesEnClasicos = seasonClasicos
        ? seasonClasicos.golesRealMadrid + seasonClasicos.golesBarcelona
        : (existingSeason.heroStats?.golesEnClasicos || 0);

    // 9. Titulos de la temporada (mantener existentes, dificil de detectar automaticamente)
    const seasonTitulos = existingSeason.titulos || {
        realMadrid: { liga: 0, championsLeague: 0, copaDelRey: 0, supercopaEspana: 0, supercopaEuropa: 0, mundialClubes: 0, copaLiga: 0, recopa: 0 },
        barcelona: { liga: 0, championsLeague: 0, copaDelRey: 0, supercopaEspana: 0, supercopaEuropa: 0, mundialClubes: 0, copaLiga: 0, recopa: 0 }
    };

    // Construir objeto completo
    const temporadaActual = {
        meta: {
            temporada: season,
            nota: `Datos de la temporada ${season} en todas las competiciones. Actualizado automaticamente.`
        },
        heroStats: {
            clasicosDisputados,
            golesEnClasicos,
            subtitulo: `Temporada ${season}`
        },
        titulos: seasonTitulos,
        historialGeneral: {
            realMadrid: rmRecord || existingSeason.historialGeneral?.realMadrid || {},
            barcelona: fcbRecord || existingSeason.historialGeneral?.barcelona || {}
        },
        elClasico: seasonClasicos || existingSeason.elClasico || {
            totalPartidos: 0, victoriasRealMadrid: 0, victoriasBarcelona: 0, empates: 0,
            golesRealMadrid: 0, golesBarcelona: 0, partidos: [],
            porCompeticion: {
                liga: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
                copaDelRey: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
                championsLeague: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 },
                supercopa: { partidos: 0, rmVictorias: 0, fcbVictorias: 0, empates: 0 }
            },
            evolucionHistorica: []
        },
        estadisticasDetalladas: {
            realMadrid: statsRM || {},
            barcelona: statsFCB || {}
        },
        topJugadores: {
            goleadores: {
                realMadrid: topStats.goleadores.realMadrid.length > 0 ? topStats.goleadores.realMadrid : (existingSeason.topJugadores?.goleadores?.realMadrid || []),
                barcelona: topStats.goleadores.barcelona.length > 0 ? topStats.goleadores.barcelona : (existingSeason.topJugadores?.goleadores?.barcelona || [])
            },
            asistentes: {
                realMadrid: topStats.asistentes.realMadrid.length > 0 ? topStats.asistentes.realMadrid : (existingSeason.topJugadores?.asistentes?.realMadrid || []),
                barcelona: topStats.asistentes.barcelona.length > 0 ? topStats.asistentes.barcelona : (existingSeason.topJugadores?.asistentes?.barcelona || [])
            }
        }
    };

    return { temporadaActual, ultimoPartido: { realMadrid: ultimoRM, barcelona: ultimoFCB } };
}

// ============================================================
// Merge historico con validacion de cordura
// ============================================================

function mergeHistorical(existing, wikipedia) {
    const updated = JSON.parse(JSON.stringify(existing)); // deep clone
    let changes = 0;

    console.log('\n[MERGE] Validando datos historicos...\n');

    // Titulos - estos se actualizan directamente (son absolutos, no acumulativos)
    if (wikipedia.titulos) {
        for (const team of ['realMadrid', 'barcelona']) {
            for (const [key, value] of Object.entries(wikipedia.titulos[team] || {})) {
                const range = SANITY_RANGES.titulos[key];
                if (!range) continue;

                if (sanityCheck(value, range, `${team}.${key}`)) {
                    if (value !== updated.titulos[team][key]) {
                        console.log(`      Actualizado: ${updated.titulos[team][key]} -> ${value}`);
                        updated.titulos[team][key] = value;
                        changes++;
                    }
                }
            }
        }
    }

    // El Clasico - actualizar el BASELINE, no los valores de display
    // Los valores de display se calculan como baseline + temporada
    if (wikipedia.clasico && updated.historicalBaseline) {
        const baseline = updated.historicalBaseline.elClasico;
        const seasonClasico = updated.temporadaActual?.elClasico || {};

        for (const [key, value] of Object.entries(wikipedia.clasico)) {
            const range = SANITY_RANGES.clasico[key];
            if (!range) continue;

            if (sanityCheck(value, range, `clasico.${key}`)) {
                // Wikipedia da el total historico real.
                // El baseline deberia ser: total_wikipedia - clasicos_esta_temporada
                const seasonVal = seasonClasico[key] || 0;
                const newBaseline = value - seasonVal;

                if (newBaseline !== baseline[key]) {
                    console.log(`      Baseline actualizado: ${baseline[key]} -> ${newBaseline} (wikipedia=${value} - temporada=${seasonVal})`);
                    baseline[key] = newBaseline;
                    changes++;
                }
            }
        }
    } else if (wikipedia.clasico) {
        // Sin baseline aun, actualizar directamente (legacy)
        for (const [key, value] of Object.entries(wikipedia.clasico)) {
            const range = SANITY_RANGES.clasico[key];
            if (!range) continue;

            if (sanityCheck(value, range, `clasico.${key}`)) {
                if (value !== updated.elClasico[key]) {
                    console.log(`      Actualizado: ${updated.elClasico[key]} -> ${value}`);
                    updated.elClasico[key] = value;
                    changes++;
                }
            }
        }
    }

    return { updated, changes };
}

// ============================================================
// Acumulacion: baseline historico + temporada actual
// ============================================================

/**
 * Crea el baseline inicial restando los datos de temporada actual
 * de los datos historicos actuales (para evitar doble conteo)
 */
function bootstrapBaseline(stats) {
    const season = stats.temporadaActual;
    if (!season) return null;

    console.log('\n[BOOTSTRAP] Creando historicalBaseline inicial...');
    console.log('  Formula: baseline = historico_actual - temporada_actual');

    const seasonStr = season.meta?.temporada ||
        `${CURRENT_SEASON}-${(CURRENT_SEASON + 1).toString().slice(2)}`;

    const baseline = {
        temporada: seasonStr,
        historialGeneral: {},
        estadisticasDetalladas: {},
        elClasico: {}
    };

    // historialGeneral: restar temporada del historico
    for (const team of ['realMadrid', 'barcelona']) {
        const hist = stats.historialGeneral[team];
        const sea = season.historialGeneral?.[team] || {};
        baseline.historialGeneral[team] = {
            partidosJugados: hist.partidosJugados - (sea.partidosJugados || 0),
            ganados: hist.ganados - (sea.ganados || 0),
            empatados: hist.empatados - (sea.empatados || 0),
            perdidos: hist.perdidos - (sea.perdidos || 0),
            golesAFavor: hist.golesAFavor - (sea.golesAFavor || 0),
            golesEnContra: hist.golesEnContra - (sea.golesEnContra || 0)
        };
        console.log(`  ${team}: ${hist.partidosJugados} - ${sea.partidosJugados || 0} = ${baseline.historialGeneral[team].partidosJugados} PJ base`);
    }

    // estadisticasDetalladas: restar temporada
    for (const team of ['realMadrid', 'barcelona']) {
        const hist = stats.estadisticasDetalladas[team];
        const sea = season.estadisticasDetalladas?.[team] || {};
        baseline.estadisticasDetalladas[team] = {};

        for (const key of Object.keys(hist)) {
            if (key === 'posesionMedia') {
                // La posesion es un promedio, guardar el valor historico como base
                baseline.estadisticasDetalladas[team][key] = hist[key];
            } else {
                baseline.estadisticasDetalladas[team][key] = hist[key] - (sea[key] || 0);
            }
        }
    }

    // elClasico: restar clasicos de esta temporada
    const histClasico = stats.elClasico;
    const seaClasico = season.elClasico || {};
    baseline.elClasico = {
        totalPartidos: histClasico.totalPartidos - (seaClasico.totalPartidos || 0),
        victoriasRealMadrid: histClasico.victoriasRealMadrid - (seaClasico.victoriasRealMadrid || 0),
        victoriasBarcelona: histClasico.victoriasBarcelona - (seaClasico.victoriasBarcelona || 0),
        empates: histClasico.empates - (seaClasico.empates || 0),
        golesRealMadrid: histClasico.golesRealMadrid - (seaClasico.golesRealMadrid || 0),
        golesBarcelona: histClasico.golesBarcelona - (seaClasico.golesBarcelona || 0),
        porCompeticion: {}
    };

    // porCompeticion
    for (const comp of ['liga', 'copaDelRey', 'championsLeague', 'supercopa']) {
        const histComp = histClasico.porCompeticion?.[comp] || {};
        const seaComp = seaClasico.porCompeticion?.[comp] || {};
        baseline.elClasico.porCompeticion[comp] = {
            partidos: (histComp.partidos || 0) - (seaComp.partidos || 0),
            rmVictorias: (histComp.rmVictorias || 0) - (seaComp.rmVictorias || 0),
            fcbVictorias: (histComp.fcbVictorias || 0) - (seaComp.fcbVictorias || 0),
            empates: (histComp.empates || 0) - (seaComp.empates || 0)
        };
    }

    console.log(`  Clasico base: ${baseline.elClasico.totalPartidos} partidos (hist ${histClasico.totalPartidos} - temp ${seaClasico.totalPartidos || 0})`);

    return baseline;
}

/**
 * Acumula los datos historicos: baseline + temporada actual
 * Escribe el resultado en stats.historialGeneral, stats.estadisticasDetalladas, stats.elClasico
 */
function accumulateHistorical(stats) {
    const baseline = stats.historicalBaseline;
    const season = stats.temporadaActual;

    if (!baseline || !season) return;

    console.log('\n[ACUMULACION] Calculando historico = baseline + temporada actual...');

    // 1. historialGeneral
    for (const team of ['realMadrid', 'barcelona']) {
        const base = baseline.historialGeneral[team];
        const sea = season.historialGeneral?.[team] || {};

        for (const field of ['partidosJugados', 'ganados', 'empatados', 'perdidos', 'golesAFavor', 'golesEnContra']) {
            stats.historialGeneral[team][field] = (base[field] || 0) + (sea[field] || 0);
        }

        console.log(`  ${team}: ${stats.historialGeneral[team].partidosJugados} PJ (${base.partidosJugados}+${sea.partidosJugados || 0}), ${stats.historialGeneral[team].golesAFavor} GF (${base.golesAFavor}+${sea.golesAFavor || 0})`);
    }

    // 2. estadisticasDetalladas
    for (const team of ['realMadrid', 'barcelona']) {
        const base = baseline.estadisticasDetalladas[team];
        const sea = season.estadisticasDetalladas?.[team] || {};

        for (const key of Object.keys(base)) {
            if (key === 'posesionMedia') {
                // Media ponderada por partidos jugados
                const baseGames = baseline.historialGeneral[team].partidosJugados || 1;
                const seaGames = season.historialGeneral?.[team]?.partidosJugados || 0;
                const totalGames = baseGames + seaGames;
                stats.estadisticasDetalladas[team][key] = totalGames > 0
                    ? Math.round(((base[key] * baseGames + (sea[key] || 50) * seaGames) / totalGames) * 10) / 10
                    : base[key];
            } else {
                stats.estadisticasDetalladas[team][key] = (base[key] || 0) + (sea[key] || 0);
            }
        }
    }

    // 3. elClasico (totales)
    const baseClasico = baseline.elClasico;
    const seaClasico = season.elClasico || {};

    for (const field of ['totalPartidos', 'victoriasRealMadrid', 'victoriasBarcelona', 'empates', 'golesRealMadrid', 'golesBarcelona']) {
        stats.elClasico[field] = (baseClasico[field] || 0) + (seaClasico[field] || 0);
    }

    console.log(`  Clasico: ${stats.elClasico.totalPartidos} totales (${baseClasico.totalPartidos}+${seaClasico.totalPartidos || 0})`);

    // 4. elClasico.porCompeticion
    for (const comp of ['liga', 'copaDelRey', 'championsLeague', 'supercopa']) {
        const baseComp = baseClasico.porCompeticion?.[comp] || {};
        const seaComp = seaClasico.porCompeticion?.[comp] || {};

        if (!stats.elClasico.porCompeticion[comp]) {
            stats.elClasico.porCompeticion[comp] = {};
        }

        for (const field of ['partidos', 'rmVictorias', 'fcbVictorias', 'empates']) {
            stats.elClasico.porCompeticion[comp][field] = (baseComp[field] || 0) + (seaComp[field] || 0);
        }
    }

    // evolucionHistorica y mayorGoleada se mantienen del baseline (son datos estaticos)
}

/**
 * Detecta cambio de temporada y hace rollover del baseline
 */
function checkSeasonRollover(stats) {
    const currentSeasonStr = `${CURRENT_SEASON}-${(CURRENT_SEASON + 1).toString().slice(2)}`;
    const baselineSeason = stats.historicalBaseline?.temporada;

    if (baselineSeason && baselineSeason !== currentSeasonStr) {
        console.log(`\n[ROLLOVER] Nueva temporada detectada: ${baselineSeason} -> ${currentSeasonStr}`);
        console.log('  Los datos acumulados de la temporada anterior se convierten en el nuevo baseline');

        // El historialGeneral actual (baseline+temporada_anterior) se convierte en el nuevo baseline
        stats.historicalBaseline = {
            temporada: currentSeasonStr,
            historialGeneral: JSON.parse(JSON.stringify(stats.historialGeneral)),
            estadisticasDetalladas: JSON.parse(JSON.stringify(stats.estadisticasDetalladas)),
            elClasico: {
                totalPartidos: stats.elClasico.totalPartidos,
                victoriasRealMadrid: stats.elClasico.victoriasRealMadrid,
                victoriasBarcelona: stats.elClasico.victoriasBarcelona,
                empates: stats.elClasico.empates,
                golesRealMadrid: stats.elClasico.golesRealMadrid,
                golesBarcelona: stats.elClasico.golesBarcelona,
                porCompeticion: JSON.parse(JSON.stringify(stats.elClasico.porCompeticion))
            }
        };

        return true;
    }

    return false;
}

// ============================================================
// Actualizar data.js (datos embebidos)
// ============================================================

function updateDataJS(stats) {
    const dataJSContent = fs.readFileSync(DATA_JS_PATH, 'utf8');
    const marker = 'DataService.STATS_DATA = ';
    const markerIndex = dataJSContent.indexOf(marker);

    if (markerIndex === -1) {
        console.warn('  [ERROR] No se encontro STATS_DATA en data.js');
        return false;
    }

    const jsonStart = markerIndex + marker.length;
    let braceCount = 0;
    let jsonEnd = jsonStart;

    for (let i = jsonStart; i < dataJSContent.length; i++) {
        if (dataJSContent[i] === '{') braceCount++;
        if (dataJSContent[i] === '}') braceCount--;
        if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
        }
    }

    const before = dataJSContent.substring(0, jsonStart);
    const after = dataJSContent.substring(jsonEnd);
    const newContent = before + JSON.stringify(stats, null, 2) + after;

    fs.writeFileSync(DATA_JS_PATH, newContent, 'utf8');
    return true;
}

// ============================================================
// Main
// ============================================================

async function main() {
    console.log('==============================================');
    console.log('  ACTUALIZACION DE ESTADISTICAS v3.0');
    console.log(`  ${new Date().toLocaleString('es-ES')}`);
    console.log(`  Temporada: ${CURRENT_SEASON}-${CURRENT_SEASON + 1}`);
    if (DRY_RUN) console.log('  MODO DRY-RUN (no se guardan cambios)');
    if (!API_KEY) console.log('  [AVISO] Sin API_KEY - solo datos de Wikipedia');
    console.log('==============================================');

    // 1. Cargar datos existentes
    let existing;
    try {
        existing = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
        console.log('\nDatos existentes: ultima actualizacion ' + existing.meta.lastUpdated);
    } catch (err) {
        console.error('[FATAL] No se pudo leer stats.json:', err.message);
        process.exit(1);
    }

    let totalChanges = 0;

    // 2. Bootstrap del baseline historico (primera vez)
    if (!existing.historicalBaseline) {
        existing.historicalBaseline = bootstrapBaseline(existing);
        if (existing.historicalBaseline) {
            totalChanges++;
        }
    } else {
        console.log(`\n[BASELINE] Existente para temporada ${existing.historicalBaseline.temporada}`);
    }

    // 3. Detectar cambio de temporada (rollover)
    if (existing.historicalBaseline && checkSeasonRollover(existing)) {
        totalChanges++;
    }

    // 4. Datos historicos (Wikipedia) - actualiza titulos y baseline del Clasico
    const wikipedia = await fetchHistoricalFromWikipedia();
    const { updated: withHistorical, changes: histChanges } = mergeHistorical(existing, wikipedia);
    totalChanges += histChanges;
    console.log(`\n  Cambios historicos: ${histChanges}`);

    // 5. Datos de temporada actual (football-data.org)
    const seasonResult = await buildSeasonData(withHistorical);

    if (seasonResult) {
        withHistorical.temporadaActual = seasonResult.temporadaActual;
        console.log('\n  Temporada actual: ACTUALIZADA');
        totalChanges++;

        // Ultimo partido (global, no dentro de temporadaActual)
        if (seasonResult.ultimoPartido) {
            if (seasonResult.ultimoPartido.realMadrid) {
                withHistorical.ultimoPartido = withHistorical.ultimoPartido || {};
                withHistorical.ultimoPartido.realMadrid = seasonResult.ultimoPartido.realMadrid;
            }
            if (seasonResult.ultimoPartido.barcelona) {
                withHistorical.ultimoPartido = withHistorical.ultimoPartido || {};
                withHistorical.ultimoPartido.barcelona = seasonResult.ultimoPartido.barcelona;
            }
            console.log('  Ultimo partido: ACTUALIZADO');
            totalChanges++;
        }
    }

    // 6. Acumular historicos: baseline + temporada actual
    if (withHistorical.historicalBaseline && withHistorical.temporadaActual) {
        accumulateHistorical(withHistorical);
        console.log('  Historico acumulado: baseline + temporada actual');
        totalChanges++;
    }

    // 4. Actualizar metadatos
    withHistorical.meta.lastUpdated = new Date().toISOString().split('T')[0];

    // 5. Guardar
    if (DRY_RUN) {
        console.log('\n[DRY-RUN] No se guardaron cambios.');
        console.log(JSON.stringify(withHistorical.temporadaActual?.historialGeneral, null, 2));
    } else if (totalChanges > 0) {
        fs.writeFileSync(STATS_PATH, JSON.stringify(withHistorical, null, 2), 'utf8');
        console.log('\n[GUARDADO] stats.json actualizado');

        if (updateDataJS(withHistorical)) {
            console.log('[GUARDADO] data.js actualizado (datos embebidos)');
        }
    } else {
        // Actualizar fecha aunque no haya cambios
        fs.writeFileSync(STATS_PATH, JSON.stringify(withHistorical, null, 2), 'utf8');
        updateDataJS(withHistorical);
        console.log('\n[OK] Sin cambios en datos, fecha actualizada.');
    }

    // 6. Log
    console.log('\n==============================================');
    console.log(`  COMPLETADO - ${totalChanges} cambio(s)`);
    console.log(`  ${withHistorical.meta.lastUpdated}`);
    console.log('==============================================\n');

    const logPath = path.join(__dirname, 'update-log.txt');
    const logEntry = `[${new Date().toISOString()}] v3.0 - ${totalChanges} cambio(s) aplicados\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
