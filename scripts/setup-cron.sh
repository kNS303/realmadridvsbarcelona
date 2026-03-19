#!/bin/bash
# ============================================
# Configurar cron job para actualización semanal
# Ejecutar en el servidor donde se despliegue la app
# ============================================

# Ruta al proyecto (ajustar según tu servidor)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Crear cron job: cada lunes a las 06:00
CRON_CMD="0 6 * * 1 cd $PROJECT_DIR && /usr/bin/node scripts/update-stats.js >> scripts/update-log.txt 2>&1"

# Añadir al crontab si no existe ya
(crontab -l 2>/dev/null | grep -v "update-stats.js"; echo "$CRON_CMD") | crontab -

echo "✅ Cron job configurado:"
echo "   Frecuencia: Cada lunes a las 06:00"
echo "   Comando: node scripts/update-stats.js"
echo "   Log: scripts/update-log.txt"
echo ""
echo "Para verificar: crontab -l"
echo "Para eliminar:  crontab -l | grep -v update-stats | crontab -"