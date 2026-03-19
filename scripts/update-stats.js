/**
 * Script de actualización automática de estadísticas
 *
 * Estrategia: usa la API de Wikipedia (Wikidata) para datos estructurados
 * + football-data.org para temporada actual (opcional)
 *
 * IMPORTANTE: Incluye validaciones de cordura para nunca aceptar datos absurdos
 *
 * Uso:
 *   node scripts/update-stats.js                    # Solo validación + API Wikipedia
 *   API_KEY=tu_key node scripts/update-stats.js     # + datos de temporada actual
 *
 * Programación (producción):
 *   Cron semanal: 0 6 * * 1 cd /ruta/proyecto && node scripts/update-stats.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '..', 'data', 'stats.json');
const DATA_JS_PATH = path.join(__dirname, '..', 'js', 'data.js');
const API_KEY = process.env.API_KEY || null;
const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================
// Rangos válidos para validación de cordura
// Si un dato scraped cae fuera de estos rangos, se RECHAZA
// Actualizar estos rangos manualmente si un equipo supera el máximo
// ============================================================
const SANITY_RANGES = {
    titulos: {
        liga:              { min: 20, max: 50 },   // ambos tienen 27-36
        championsLeague:   { min: 3,  max: 20 },   // RM: 15, FCB: 5
        copaDelRey:        { min: 15, max: 40 },   // RM: 20, FCB: 31
        supercopaEspana:   { min: 8,  max: 25 },
        supercopaEuropa:   { min: 3,  max: 15 },
        mundialClubes:     { min: 1,  max: 15 },
        copaLiga:          { min: 0,  max: 5 },
        recopa:            { min: 0,  max: 10 }
    },
    clasico: {
        totalPartidos:        { min: 240, max: 300 },
        victoriasRealMadrid:  { min: 90,  max: 130 },
        victoriasBarcelona:   { min: 85,  max: 130 },
        empates:              { min: 40,  max: 70 }
    }
};

// ============================================================
// Utilidades HTTP
// ============================================================

function fetchURL(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'ElClasicoStats/1.0 (bot; educational)', ...headers } };
        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchURL(res.headers.location, headers).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
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

// ============================================================
// Validación de cordura
// ============================================================

function sanityCheck(value, range, label) {
    if (value === null || value === undefined || isNaN(value)) {
        console.log(`    ❌ ${label}: valor inválido (${value}), RECHAZADO`);
        return false;
    }
    if (value < range.min || value > range.max) {
        console.log(`    ❌ ${label}: ${value} fuera de rango [${range.min}-${range.max}], RECHAZADO`);
        return false;
    }
    console.log(`    ✅ ${label}: ${value} (rango OK)`);
    return true;
}

// ============================================================
// Fuente: Wikipedia API (Wikidata SPARQL - datos estructurados)
// ============================================================

async function fetchFromWikidataAPI() {
    console.log('📊 Consultando Wikidata API (datos estructurados)...\n');

    const results = { realMadrid: {}, barcelona: {} };

    try {
        // Wikidata IDs: Real Madrid = Q8682, FC Barcelona = Q7156
        // Propiedad P1346 = ganador de, P2522 = victoria

        // Usar la API REST de Wikipedia para obtener extractos de las páginas
        const rmData = await fetchJSON(
            'https://en.wikipedia.org/api/rest_v1/page/summary/Real_Madrid_CF'
        );
        const fcbData = await fetchJSON(
            'https://en.wikipedia.org/api/rest_v1/page/summary/FC_Barcelona'
        );

        console.log(`  RM: "${rmData.description || 'sin descripción'}"`);
        console.log(`  FCB: "${fcbData.description || 'sin descripción'}"`);

        // Los extractos de Wikipedia suelen incluir datos básicos
        // pero no los títulos detallados. Para eso necesitamos la infobox.
        // Usamos la API de MediaWiki para obtener la infobox parseada

        const rmInfobox = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=Real_Madrid_CF&prop=wikitext&section=0&format=json'
        );
        const fcbInfobox = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=FC_Barcelona&prop=wikitext&section=0&format=json'
        );

        // Extraer de la infobox de Wikipedia
        const rmText = rmInfobox?.parse?.wikitext?.['*'] || '';
        const fcbText = fcbInfobox?.parse?.wikitext?.['*'] || '';

        // Buscar patrones de la infobox de Wikipedia
        // Ejemplo: "| league = [[La Liga]] (36)" o similar
        results.realMadrid = extractInfoboxTitles(rmText, 'Real Madrid');
        results.barcelona = extractInfoboxTitles(fcbText, 'Barcelona');

    } catch (err) {
        console.warn('  ⚠️  Error consultando Wikipedia API:', err.message);
    }

    return results;
}

/**
 * Extrae títulos de la infobox de Wikipedia (wikitext)
 */
function extractInfoboxTitles(wikitext, teamLabel) {
    const titles = {};

    // Patrones para la infobox de clubes de fútbol en Wikipedia
    // La Liga: buscar "(número)" cerca de "La Liga" o "First Division"
    const leagueMatch = wikitext.match(/\[\[La Liga\]\][^\n]*?\((\d+)\)/i)
                     || wikitext.match(/league\s*=.*?(\d+)/i);
    if (leagueMatch) titles.liga = parseInt(leagueMatch[1]);

    // Champions League
    const clMatch = wikitext.match(/\[\[UEFA Champions League\|Champions League\]\][^\n]*?\((\d+)\)/i)
                  || wikitext.match(/\[\[European Cup\|/i) && wikitext.match(/Champions[^\n]*?\((\d+)\)/i);
    if (clMatch) titles.championsLeague = parseInt(clMatch[1] || clMatch);

    // Copa del Rey
    const copaMatch = wikitext.match(/\[\[Copa del Rey\]\][^\n]*?\((\d+)\)/i);
    if (copaMatch) titles.copaDelRey = parseInt(copaMatch[1]);

    console.log(`  📋 ${teamLabel} infobox:`, JSON.stringify(titles));
    return titles;
}

// ============================================================
// Fuente: El Clásico desde Wikipedia
// ============================================================

async function fetchClasicoData() {
    console.log('\n⚔️  Consultando datos de El Clásico...');

    const result = {};

    try {
        const data = await fetchJSON(
            'https://en.wikipedia.org/w/api.php?action=parse&page=El_Cl%C3%A1sico&prop=wikitext&section=0&format=json'
        );

        const wikitext = data?.parse?.wikitext?.['*'] || '';

        // Buscar en la infobox / texto inicial
        // Patrones: "X wins" para cada equipo
        const totalMatch = wikitext.match(/total[_\s]*meetings\s*=\s*(\d+)/i)
                        || wikitext.match(/(\d+)\s*(?:total\s*)?(?:competitive\s*)?(?:official\s*)?matches/i);

        const team1WinsMatch = wikitext.match(/team1wins\s*=\s*(\d+)/i)
                            || wikitext.match(/Real Madrid[^\n]*?(\d+)\s*wins/i);

        const team2WinsMatch = wikitext.match(/team2wins\s*=\s*(\d+)/i)
                            || wikitext.match(/Barcelona[^\n]*?(\d+)\s*wins/i);

        const drawsMatch = wikitext.match(/draws\s*=\s*(\d+)/i);

        if (totalMatch) result.totalPartidos = parseInt(totalMatch[1]);
        if (team1WinsMatch) result.victoriasRealMadrid = parseInt(team1WinsMatch[1]);
        if (team2WinsMatch) result.victoriasBarcelona = parseInt(team2WinsMatch[1]);
        if (drawsMatch) result.empates = parseInt(drawsMatch[1]);

        console.log('  📋 Datos extraídos:', JSON.stringify(result));
    } catch (err) {
        console.warn('  ⚠️  Error:', err.message);
    }

    return result;
}

// ============================================================
// Fuente: football-data.org (temporada actual, requiere API key)
// ============================================================

async function fetchCurrentSeason() {
    if (!API_KEY) {
        console.log('\n📡 API key no configurada. Para datos de temporada actual:');
        console.log('   1. Regístrate gratis en https://www.football-data.org/');
        console.log('   2. Ejecuta: API_KEY=tu_key node scripts/update-stats.js\n');
        return null;
    }

    console.log('\n📡 Obteniendo temporada actual desde football-data.org...');

    try {
        const standings = await fetchJSON(
            'https://api.football-data.org/v4/competitions/PD/standings',
            { 'X-Auth-Token': API_KEY }
        );
        const table = standings.standings?.[0]?.table || [];

        const rmStanding = table.find(t => t.team.id === 86);
        const fcbStanding = table.find(t => t.team.id === 81);

        const result = {
            temporada: standings.season?.startDate?.substring(0, 4) + '-' + standings.season?.endDate?.substring(0, 4),
            realMadrid: rmStanding ? {
                posicionLiga: rmStanding.position,
                puntos: rmStanding.points,
                golesMarcados: rmStanding.goalsFor,
                golesRecibidos: rmStanding.goalsAgainst,
                partidosJugados: rmStanding.playedGames,
                ganados: rmStanding.won,
                empatados: rmStanding.draw,
                perdidos: rmStanding.lost
            } : null,
            barcelona: fcbStanding ? {
                posicionLiga: fcbStanding.position,
                puntos: fcbStanding.points,
                golesMarcados: fcbStanding.goalsFor,
                golesRecibidos: fcbStanding.goalsAgainst,
                partidosJugados: fcbStanding.playedGames,
                ganados: fcbStanding.won,
                empatados: fcbStanding.draw,
                perdidos: fcbStanding.lost
            } : null
        };

        console.log('  ✅ Temporada:', result.temporada);
        return result;
    } catch (err) {
        console.warn('  ⚠️  Error API:', err.message);
        return null;
    }
}

// ============================================================
// Merge con validación de cordura
// ============================================================

function mergeStats(existing, scraped) {
    const updated = JSON.parse(JSON.stringify(existing)); // deep clone
    let changes = 0;

    console.log('\n🔍 Validando y aplicando cambios...\n');

    // Títulos
    if (scraped.titulos) {
        for (const team of ['realMadrid', 'barcelona']) {
            for (const [key, value] of Object.entries(scraped.titulos[team] || {})) {
                const range = SANITY_RANGES.titulos[key];
                if (!range) continue;

                if (sanityCheck(value, range, `${team}.${key}`)) {
                    const oldVal = updated.titulos[team][key];
                    if (value !== oldVal) {
                        console.log(`      📝 Actualizado: ${oldVal} → ${value}`);
                        updated.titulos[team][key] = value;
                        changes++;
                    }
                }
            }
        }
    }

    // El Clásico
    if (scraped.clasico) {
        for (const [key, value] of Object.entries(scraped.clasico)) {
            const range = SANITY_RANGES.clasico[key];
            if (!range) continue;

            if (sanityCheck(value, range, `clasico.${key}`)) {
                const oldVal = updated.elClasico[key];
                if (value !== oldVal) {
                    console.log(`      📝 Actualizado: ${oldVal} → ${value}`);
                    updated.elClasico[key] = value;
                    changes++;
                }
            }
        }
    }

    // Temporada actual (sin validación de rangos, los datos vienen de una API oficial)
    if (scraped.temporadaActual) {
        updated.temporadaActual = scraped.temporadaActual;
        console.log('  📝 Temporada actual actualizada');
        changes++;
    }

    // Actualizar metadatos
    updated.meta.lastUpdated = new Date().toISOString().split('T')[0];

    console.log(`\n  📊 Total cambios aplicados: ${changes}`);
    return { updated, changes };
}

// ============================================================
// Actualizar data.js (datos embebidos)
// ============================================================

function updateDataJS(stats) {
    const dataJSContent = fs.readFileSync(DATA_JS_PATH, 'utf8');
    const marker = 'DataService.STATS_DATA = ';
    const markerIndex = dataJSContent.indexOf(marker);

    if (markerIndex === -1) {
        console.warn('  ⚠️  No se encontró STATS_DATA en data.js');
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
    console.log('═══════════════════════════════════════════');
    console.log('  🔄 Actualización de estadísticas');
    console.log(`  📅 ${new Date().toLocaleString('es-ES')}`);
    if (DRY_RUN) console.log('  🧪 MODO DRY-RUN (no se guardan cambios)');
    console.log('═══════════════════════════════════════════\n');

    // 1. Cargar datos existentes
    let existing;
    try {
        existing = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
        console.log('📂 Datos existentes: última actualización ' + existing.meta.lastUpdated + '\n');
    } catch (err) {
        console.error('❌ No se pudo leer stats.json:', err.message);
        process.exit(1);
    }

    // 2. Obtener datos de todas las fuentes en paralelo
    const [titulos, clasico, temporadaActual] = await Promise.all([
        fetchFromWikidataAPI(),
        fetchClasicoData(),
        fetchCurrentSeason()
    ]);

    // 3. Merge con validación
    const scraped = { titulos, clasico, temporadaActual };
    const { updated, changes } = mergeStats(existing, scraped);

    // 4. Guardar (si no es dry-run y hay cambios)
    if (DRY_RUN) {
        console.log('\n🧪 Dry-run: no se guardaron cambios.');
    } else if (changes > 0) {
        fs.writeFileSync(STATS_PATH, JSON.stringify(updated, null, 2), 'utf8');
        console.log('\n💾 stats.json actualizado');

        if (updateDataJS(updated)) {
            console.log('💾 data.js actualizado (datos embebidos)');
        }
    } else {
        console.log('\n✨ Sin cambios necesarios, todo está al día.');
    }

    // 5. Log
    console.log('\n═══════════════════════════════════════════');
    console.log(`  ✅ Completado — ${changes} cambio(s)`);
    console.log(`  📅 ${updated.meta.lastUpdated}`);
    console.log('═══════════════════════════════════════════\n');

    const logPath = path.join(__dirname, 'update-log.txt');
    const logEntry = `[${new Date().toISOString()}] ${changes} cambio(s) aplicados\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
}

main().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});