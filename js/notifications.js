/**
 * Notifications - Sistema de recordatorio para el proximo Clasico
 * Usa Notification API del navegador + localStorage. Sin push real (GitHub Pages estatico).
 */

const NOTIF_STORAGE_KEY = 'clasico_notif';

function initNotifications(clasicoData) {
    if (!clasicoData || !clasicoData.isoFecha) return;

    const isoFecha = clasicoData.isoFecha;
    const fechaClasico = new Date(isoFecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diffMs = fechaClasico - hoy;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Ya paso
    if (diffDias < 0) return;

    // Comprobar si hay notificacion pendiente que mostrar ahora
    checkPendingNotification(isoFecha, diffDias);

    // Mostrar banner
    renderClasicoBanner(clasicoData, diffDias, isoFecha);
}

function checkPendingNotification(isoFecha, diffDias) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const saved = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || 'null');
    if (!saved || saved.isoFecha !== isoFecha) return;

    // Mostrar notificacion si es hoy o manana
    if (diffDias === 0) {
        new Notification(i18n.t('notif.notifTitulo'), {
            body: i18n.t('notif.notifCuerpo'),
            icon: './assets/icon-192.png'
        });
    } else if (diffDias === 1) {
        new Notification(i18n.t('notif.notifManana'), {
            body: i18n.t('notif.notifMananaCuerpo'),
            icon: './assets/icon-192.png'
        });
    }
}

function renderClasicoBanner(clasicoData, diffDias, isoFecha) {
    const banner = document.getElementById('clasico-banner');
    if (!banner) return;

    let diasTexto;
    if (diffDias === 0) {
        diasTexto = i18n.t('notif.bannerHoy');
    } else if (diffDias === 1) {
        diasTexto = i18n.t('notif.bannerManana');
    } else {
        diasTexto = `${i18n.t('notif.bannerFaltan')} ${diffDias} ${i18n.t('notif.bannerDias')}`;
    }

    const saved = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || 'null');
    const recordatorioActivo = saved && saved.isoFecha === isoFecha;
    const supNotif = 'Notification' in window && Notification.permission !== 'denied';

    banner.innerHTML = `
        <div class="clasico-banner-inner">
            <span class="clasico-banner-icon">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 6v4l2.5 2.5"/>
                </svg>
            </span>
            <span class="clasico-banner-text">
                <span class="clasico-banner-label">${i18n.t('notif.bannerPre')}</span>
                <span class="clasico-banner-fecha">${clasicoData.fecha}</span>
                <span class="clasico-banner-sep">·</span>
                <span class="clasico-banner-dias">${diasTexto}</span>
            </span>
            ${supNotif ? `
            <button class="clasico-banner-btn ${recordatorioActivo ? 'active' : ''}" id="notif-toggle-btn" aria-label="${recordatorioActivo ? i18n.t('notif.desactivar') : i18n.t('notif.activar')}">
                ${recordatorioActivo
                    ? `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2a6 6 0 016 6c0 3.2.6 4.8 1.3 5.7H2.7C3.4 12.8 4 11.2 4 8a6 6 0 016-6z"/><path d="M8.5 17.5a1.5 1.5 0 003 0"/><circle cx="15" cy="5" r="3" fill="#34d399" stroke="none"/></svg>${i18n.t('notif.recordatorioActivo')}`
                    : `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2a6 6 0 016 6c0 3.2.6 4.8 1.3 5.7H2.7C3.4 12.8 4 11.2 4 8a6 6 0 016-6z"/><path d="M8.5 17.5a1.5 1.5 0 003 0"/></svg>${i18n.t('notif.activar')}`
                }
            </button>` : ''}
        </div>
    `;

    banner.classList.remove('hidden');

    const btn = document.getElementById('notif-toggle-btn');
    if (btn) {
        btn.addEventListener('click', () => handleNotifToggle(isoFecha, clasicoData));
    }
}

async function handleNotifToggle(isoFecha, clasicoData) {
    const saved = JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || 'null');
    const recordatorioActivo = saved && saved.isoFecha === isoFecha;

    if (recordatorioActivo) {
        // Desactivar
        localStorage.removeItem(NOTIF_STORAGE_KEY);
        rerenderBanner(clasicoData, isoFecha);
        return;
    }

    // Activar: pedir permiso si hace falta
    if (!('Notification' in window)) return;

    let permission = Notification.permission;
    if (permission === 'default') {
        permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify({ isoFecha }));
        rerenderBanner(clasicoData, isoFecha);
    } else {
        // Mostrar mensaje de error sutil en el banner
        const btn = document.getElementById('notif-toggle-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.textContent = i18n.t('notif.permisoDenegado');
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = original;
                btn.disabled = false;
            }, 3000);
        }
    }
}

function rerenderBanner(clasicoData, isoFecha) {
    const fechaClasico = new Date(isoFecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((fechaClasico - hoy) / (1000 * 60 * 60 * 24));
    renderClasicoBanner(clasicoData, diffDias, isoFecha);
}
