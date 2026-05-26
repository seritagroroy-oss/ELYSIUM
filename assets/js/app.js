// State Management
let currentSiteId = null;
let currentPeriod = new Date();
let periodDates = [];
let appSettings = { cycle_start: 21, cycle_end: 20 };
let systemFunctions = [];
let isHistoricalView = false;
let historicalPresentDisplay = '1';
const subscriptionState = window.SUBSCRIPTION_STATE || null;
const isSubscriptionAllowed = !!(subscriptionState && subscriptionState.access_allowed);
const isSubscriptionTrial = !!(subscriptionState && subscriptionState.status === 'trial');
const isSubscriptionExpired = !!(subscriptionState && !subscriptionState.access_allowed);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initSubscriptionBanner === 'function') {
        initSubscriptionBanner({
            lockSelector: '.no-lock-target',
            trialTextPrefix: 'Mode gratuit (Essai 15 jours) : il vous reste ',
            trialTextSuffix: ' jour(s) avant expiration.'
        });
    }
    if (isSubscriptionExpired) {
        activateSubscriptionLockMode();
        return;
    }

    // Start loading settings in background
    loadSettings().then(() => {
        // Once settings are loaded, refresh display to use correct cycle
        updatePeriodDisplay();
    });

    loadSites();
    updatePeriodDisplay();
    loadMessages();
    setInterval(loadMessages, 30000);
});

function activateSubscriptionLockMode() {
    document.body.classList.add('subscription-locked');
    const title = document.getElementById('current-site-title');
    if (title) title.textContent = 'Abonnement inactif';

    const area = document.getElementById('main-grid-area');
    if (area) {
        area.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; height:100%;">
                <div style="max-width:720px; width:100%; border:1px solid rgba(239,68,68,0.45); background: rgba(239,68,68,0.08); border-radius:16px; padding:1.5rem;">
                    <h3 style="margin-bottom:0.6rem; color:#fca5a5;">Abonnement requis</h3>
                    <p style="color:#fecaca; margin-bottom:1rem;">
                        L'abonnement du compte administrateur est expire ou non active. Toutes les fonctionnalites sont bloquees pour tous les comptes/services jusqu'au paiement.
                    </p>
                    <a href="subscription.php" class="btn btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fas fa-credit-card"></i> Aller au paiement
                    </a>
                </div>
            </div>
        `;
    }
}

async function loadSettings() {
    try {
        const res = await fetch('api.php?action=get_settings');
        if (!res.ok) throw new Error('Settings fetch failed');
        const data = await res.json();
        appSettings = data;

        // Also load functions
        const fRes = await fetch('api.php?action=get_functions');
        systemFunctions = await fRes.json();
    } catch (e) {
        console.error("Failed to load settings/functions:", e);
    }
}

function updatePeriodDisplay() {
    const lang = document.documentElement.lang || 'fr';
    const monthsLib = {
        'fr': ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        'en': ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        'es': ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        'de': ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        'it': ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
        'pt': ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    };
    const months = monthsLib[lang] || monthsLib['fr'];

    document.getElementById('current-period-display').textContent = `${months[currentPeriod.getMonth()]} ${currentPeriod.getFullYear()}`;
    calculatePeriodDates();
    if (currentSiteId) loadSiteData(currentSiteId);
}

function calculatePeriodDates() {
    periodDates = [];
    const startDay = appSettings.cycle_start;
    const endDay = appSettings.cycle_end;

    // IMPORTANT: 'Mois de Février' (currentPeriod=Feb) means 21 Jan to 20 Feb.
    // So we subtract 1 month from currentPeriod to get the start month.
    const year = currentPeriod.getFullYear();
    const month = currentPeriod.getMonth();

    // The cycle starts on the 21st of the PREVIOUS month
    const start = new Date(year, month - 1, startDay, 12, 0, 0);

    let current = new Date(start);

    // Limit to 35 days to cover the full cycle
    for (let i = 0; i < 35; i++) {
        periodDates.push(new Date(current));

        current.setDate(current.getDate() + 1);

        // If we reached the end date (e.g. 21 of next month, which is excluding)
        if (current.getDate() === endDay + 1) {
            break;
        }
    }
}

function changePeriod(delta) {
    currentPeriod.setMonth(currentPeriod.getMonth() + delta);
    updatePeriodDisplay();
}

async function loadSites() {
    try {
        const res = await fetch('api.php?action=get_sites');
        if (!res.ok) throw new Error('Failed to fetch sites');
        const sites = await res.json();

        // Populate hidden sidebar list (still used for state/reference)
        const list = document.getElementById('sites-list');
        if (list) {
            list.innerHTML = '';
            if (Array.isArray(sites)) {
                sites.forEach(site => {
                    const div = document.createElement('div');
                    div.className = `site-btn ${currentSiteId == site.id ? 'active' : ''}`;
                    div.innerHTML = `<span style="cursor: pointer; flex: 1;">${site.name}</span>`;
                    div.onclick = () => selectSite(site.id, site.name);
                    list.appendChild(div);
                });
            }
        }

        // Populate modal grid
        const grid = document.getElementById('site-selection-grid');
        if (grid) {
            grid.innerHTML = '';
            if (Array.isArray(sites)) {
                sites.forEach(site => {
                    const card = document.createElement('div');
                    card.className = `site-card ${currentSiteId == site.id ? 'active' : ''}`;
                    card.innerHTML = `
                        <div class="site-card-inner">
                            <i class="fas fa-building-shield"></i>
                            <div class="name">${site.name}</div>
                            <div class="status">Gestion du Pointage</div>
                            <div style="margin-top: 10px; display: flex; gap: 8px; z-index: 5;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.7rem; background: rgba(255,255,255,0.05); color: white;" onclick="event.stopPropagation(); openRenameSiteModal('${site.id}', '${site.name}')">
                                    <i class="fas fa-pen" style="font-size: 0.7rem; color: inherit;"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    card.onclick = () => {
                        selectSite(site.id, site.name);
                        closeModals();
                    };
                    grid.appendChild(card);
                });
            }
        }
    } catch (e) {
        console.error("Error loading sites:", e);
    }
}

function openSiteSelectionModal() {
    loadSites();
    document.getElementById('modal-site-selection').classList.add('active');
}

function selectSite(id, name) {
    isHistoricalView = false;
    currentSiteId = id;
    document.getElementById('current-site-title').textContent = name;
    const canEdit = (typeof window.USER_CAN_EDIT_DASHBOARD === 'undefined') ? true : !!window.USER_CAN_EDIT_DASHBOARD;
    const shareBtn = document.getElementById('share-btn');
    const addSubsiteBtn = document.getElementById('add-subsite-btn');
    const initBtn = document.getElementById('init-month-btn');
    const clearMutBtn = document.getElementById('clear-mutations-btn');
    if (shareBtn) shareBtn.style.display = canEdit ? 'block' : 'none';
    if (addSubsiteBtn) addSubsiteBtn.style.display = canEdit ? 'block' : 'none';
    if (initBtn) initBtn.style.display = canEdit ? 'block' : 'none';
    if (clearMutBtn) clearMutBtn.style.display = canEdit ? 'block' : 'none';
    loadSites(); // Refresh highlights
    loadSiteData(id);
}

async function loadSiteData(siteId) {
    const container = document.getElementById('main-grid-area');
    container.innerHTML = `<div style="padding: 2rem;">
        <div class="skeleton" style="height: 60px; width: 100%; margin-bottom: 20px;"></div>
        <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 80px; width: 100%; margin-bottom: 10px;"></div>
    </div>`;

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    const res = await fetch(`api.php?action=get_site_data&site_id=${siteId}&period=${periodStr}`);
    if (!res.ok) {
        showToast('Erreur de chargement des données', 'error');
        return;
    }

    const subsites = await res.json();

    // Auto-initialization check: if the period has ZERO attendance data
    let hasData = false;
    for (const sub of subsites) {
        if (sub.agents && sub.agents.some(a => a.attendance && a.attendance.length > 0)) {
            hasData = true; break;
        }
    }

    if (!hasData && subsites.length > 0) {
        // Automatically initialize the period (clean slate with '1's)
        await fetch('api.php?action=init_site_period', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site_id: siteId, period: periodStr })
        });
        // Reload initialized data
        const reloadRes = await fetch(`api.php?action=get_site_data&site_id=${siteId}&period=${periodStr}`);
        const initializedSubsites = await reloadRes.json();
        renderGrid(initializedSubsites);
        return;
    }

    renderGrid(subsites);
}

function renderGrid(subsites) {
    const container = document.getElementById('main-grid-area');
    if (subsites.length === 0) {
        container.innerHTML = '<p>Aucune donnée disponible.</p>';
        return;
    }
    
    let globalP = 0;
    let globalA = 0;

    let html = `<div class="attendance-card"><table><thead><tr>
        <th rowspan="2" style="position: sticky; left: 0; z-index: 36; background: var(--bg-sidebar); min-width: 280px; border-right: none;">Informations Agent & Totaux</th>
        <th rowspan="2" style="position: sticky; left: 280px; z-index: 35; background: var(--bg-sidebar); min-width: 40px; box-shadow: 4px 0 8px -2px rgba(0,0,0,0.5);">Shift</th>`;

    const lang = document.documentElement.lang || 'fr';
    const dayNamesLib = {
        'fr': ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        'en': ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        'es': ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        'de': ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
        'it': ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
        'pt': ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    };
    const dayNames = dayNamesLib[lang] || dayNamesLib['fr'];

    // Header for days
    periodDates.forEach(date => {
        html += `<th title="${date.toLocaleDateString()}" onclick="toggleRadar(this)" style="cursor: pointer;">
            ${date.getDate()}<br><small>${dayNames[date.getDay()]}</small>
        </th>`;
    });
    html += `</tr></thead>`;

    subsites.forEach((sub, subIdx) => {
        const isCollapsed = localStorage.getItem(`collapsed_${sub.id}`) === 'true';
        const displayStyle = isCollapsed ? 'style="display: none;"' : '';
        const isTemporarySubsite = String(sub.id).startsWith('mutated_');
        const escapedSubName = String(sub.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        html += `<tbody class="${isCollapsed ? 'subsite-collapsed' : ''}">`;

        // Spacer row
        if (subIdx > 0) {
            html += `<tr class="spacer-row" style="height: 20px;"><td colspan="${periodDates.length + 2}" style="border:none; background:transparent;"></td></tr>`;
        }

        const agentCount = sub.agents ? sub.agents.length : 0;

        html += `<tr class="subsite-header-row">
            <td colspan="${periodDates.length + 2}" class="subsite-header" onclick="toggleSubsite(this, '${sub.id}')">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-chevron-down toggle-icon"></i>
                    <span class="subsite-name" style="flex-grow: 1;">${sub.name}</span>
                    <span class="agent-count-badge">${agentCount} Agent${agentCount > 1 ? 's' : ''}</span>
                    ${isTemporarySubsite ? '' : `<i class="fas fa-edit action-icon" style="font-size: 0.8rem; margin-left: 10px;" onclick="event.stopPropagation(); openRenameSubsiteModal('${sub.id}', '${escapedSubName}')" title="Renommer la Zone"></i>`}
                    ${isTemporarySubsite ? '' : `<i class="fas fa-trash-can action-icon" style="font-size: 0.8rem; margin-left: 10px; color: var(--danger);" onclick="event.stopPropagation(); deleteSubsite('${sub.id}', '${escapedSubName}')" title="Supprimer la Zone"></i>`}
                </div>
            </td>
        </tr>`;

        if (sub.agents && sub.agents.length > 0) {
            sub.agents.forEach(agent => {
                const isRotative = ["24h", "48h", "72h"].includes(agent.shift_type);
                const rows = isRotative ? 2 : 1;
                const primaryShift = agent.shift_type === 'Nuit' ? 'N' : 'J';
                const cellClass = isRotative ? 'cell half' : 'cell';

                // Row 1
                const hasSP = agent.has_sp || (agent.attendance && agent.attendance.some(a => a.shift_code === 'S'));
                const totalRows = rows + (hasSP ? 1 : 0);
                
                let totalP = 0;
                let totalA = 0;
                let currentConsecutive = 0;
                let maxConsecutive = 0;
                
                periodDates.forEach(date => {
                    const dateStr = formatDate(date);
                    const status = getStatus(agent.attendance, dateStr, primaryShift);
                    if (status === '1') {
                        totalP++;
                        globalP++;
                        currentConsecutive++;
                        if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
                    } else if (['A', 'M', 'CP', 'AT'].includes(status)) {
                        if (status === 'A') { totalA++; globalA++; }
                        currentConsecutive = 0;
                    } else {
                        currentConsecutive = 0;
                    }
                    
                    // Also count N and S shifts for global KPI if needed
                    const statusN = getStatus(agent.attendance, dateStr, 'N');
                    if(statusN === '1') globalP++;
                    if(statusN === 'A') globalA++;
                    
                    const statusS = getStatus(agent.attendance, dateStr, 'S');
                    if(statusS === '1' || Number(statusS) > 0) globalP++;
                });

                html += `<tr ${displayStyle} class="agent-row-start" data-agent-name="${String(agent.name).toLowerCase()}">
                <td rowspan="${totalRows}" class="agent-name" style="position: sticky; left: 0; z-index: 10; background: var(--bg-sidebar); min-width: 280px; border-right: none; vertical-align: top; padding: 12px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="line-height: 1.3;">
                                <div style="font-weight: 700; font-size: 0.95rem; color: white;">
                                    ${agent.name}
                                    ${maxConsecutive > 6 ? `<i class="fas fa-triangle-exclamation" style="color: #ef4444; margin-left: 5px; font-size: 0.8rem;" title="Alerte Droit du Travail : ${maxConsecutive} jours consécutifs sans repos"></i>` : ''}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); cursor:pointer; margin-top:2px;" onclick="openFunctionModal('${agent.id}')">${agent.function} <i class="fas fa-edit" style="opacity:0.5;"></i></div>
                                <div style="font-size: 0.75rem; color: var(--primary); cursor:pointer; margin-top:2px;" onclick="openShiftModal('${agent.id}', '${agent.shift_type}')">${agent.shift_type} <i class="fas fa-edit" style="opacity:0.5;"></i></div>
                            </div>
                            <div style="display: flex; gap: 5px; flex-direction: column; align-items: flex-end;">
                                <div style="display:flex; gap:5px;">
                                    <button class="btn" style="padding: 2px 6px; font-size: 0.65rem; background: var(--primary); color: white; border-radius: 4px;" onclick="toggleSPRow('${agent.id}', ${agent.has_sp || false})" title="Ligne Supplémentaire">SP</button>
                                    <button class="btn" style="padding: 2px 6px; font-size: 0.65rem; background: #f59e0b; color: white; border-radius: 4px;" onclick="openMutationModal('${agent.id}')" title="Enregistrer une Mutation">MUT</button>
                                    <i class="fas fa-trash-can" style="color: var(--danger); font-size: 0.75rem; cursor: pointer; opacity: 0.5; margin-left: 5px;" onclick="deleteAgent('${agent.id}', '${agent.name}')"></i>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);">
                            <span style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: var(--success); padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; display: flex; align-items: center; gap: 5px;" title="Total Présences"><i class="fas fa-check-circle"></i> ${totalP}</span>
                            <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--danger); padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; display: flex; align-items: center; gap: 5px;" title="Total Absences"><i class="fas fa-times-circle"></i> ${totalA}</span>
                        </div>
                    </div>
                </td>
                <td style="position: sticky; left: 280px; z-index: 10; background: #1e293b; box-shadow: 4px 0 8px -2px rgba(0,0,0,0.5); font-size: 0.75rem; font-weight: bold; text-align: center; color: var(--text-muted);">${primaryShift}</td>`;

                let skipJ = 0;
                periodDates.forEach((date, dIdx) => {
                    if (skipJ > 0) { skipJ--; return; }
                    const dateStr = formatDate(date);
                    const status = getStatus(agent.attendance, dateStr, primaryShift);

                    if (status && status.startsWith('M|')) {
                        const dest = status.split('|')[1];
                        let count = 1;
                        for (let i = dIdx + 1; i < periodDates.length; i++) {
                            const nStatus = getStatus(agent.attendance, formatDate(periodDates[i]), primaryShift);
                            if (nStatus === status) count++; else break;
                        }
                        html += `<td class="${cellClass} status-M" colspan="${count}" onclick="clearMutation('${agent.id}', '${dateStr}', '${primaryShift}')">${dest}</td>`;
                        skipJ = count - 1;
                    } else {
                        const colorClass = status === '1' ? 'status-1' : (['A', 'M', 'CP', 'AT'].includes(status) ? 'status-A' : '');
                        const displayStatus = ['M', 'CP', 'AT'].includes(status) ? status : (status === '1' ? '1' : (status === 'A' ? 'A' : ''));
                        html += `<td class="${cellClass} ${colorClass} pointage-cell" data-agent="${agent.id}" data-date="${dateStr}" data-shift="${primaryShift}" data-status="${status}">${displayStatus}</td>`;
                    }
                });
                
                html += `</tr>`;

                // Row N (Night) if rotative
                if (isRotative) {
                    html += `<tr ${displayStyle} class="agent-row-extra">
                    <td style="position: sticky; left: 280px; z-index: 10; background: #1e293b; box-shadow: 4px 0 8px -2px rgba(0,0,0,0.5); font-size: 0.75rem; font-weight: bold; text-align: center; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05);">N</td>`;
                    let skipN = 0;
                    periodDates.forEach((date, dIdx) => {
                        if (skipN > 0) { skipN--; return; }
                        const dateStr = formatDate(date);
                        const status = getStatus(agent.attendance, dateStr, 'N');
                        if (status && status.startsWith('M|')) {
                            const dest = status.split('|')[1];
                            let count = 1;
                            for (let i = dIdx + 1; i < periodDates.length; i++) {
                                const nStatus = getStatus(agent.attendance, formatDate(periodDates[i]), 'N');
                                if (nStatus === status) count++; else break;
                            }
                            html += `<td class="${cellClass} status-M" colspan="${count}" onclick="clearMutation('${agent.id}', '${dateStr}', 'N')">${dest}</td>`;
                            skipN = count - 1;
                        } else {
                            const colorClass = status === '1' ? 'status-1' : (['A', 'M', 'CP', 'AT'].includes(status) ? 'status-A' : '');
                            const displayStatus = ['M', 'CP', 'AT'].includes(status) ? status : (status === '1' ? '1' : (status === 'A' ? 'A' : ''));
                            html += `<td class="${cellClass} ${colorClass} pointage-cell" data-agent="${agent.id}" data-date="${dateStr}" data-shift="N" data-status="${status}">${displayStatus}</td>`;
                        }
                    });
                    html += `</tr>`;
                }

                // Row SP (Supplementary)
                if (hasSP) {
                    html += `<tr ${displayStyle} class="agent-row-extra">
                    <td style="position: sticky; left: 280px; z-index: 10; background: rgba(59, 130, 246, 0.05); color: var(--primary); box-shadow: 4px 0 8px -2px rgba(0,0,0,0.5); font-size: 0.75rem; font-weight: bold; text-align: center; border-top: 1px solid rgba(59, 130, 246, 0.2);">SP</td>`;
                    let skipS = 0;
                    periodDates.forEach((date, dIdx) => {
                        if (skipS > 0) { skipS--; return; }
                        const dateStr = formatDate(date);
                        const status = getStatus(agent.attendance, dateStr, 'S');
                        if (status && status.startsWith('M|')) {
                            const dest = status.split('|')[1];
                            let count = 1;
                            for (let i = dIdx + 1; i < periodDates.length; i++) {
                                const nStatus = getStatus(agent.attendance, formatDate(periodDates[i]), 'S');
                                if (nStatus === status) count++; else break;
                            }
                            html += `<td class="${cellClass} status-M" colspan="${count}" onclick="clearMutation('${agent.id}', '${dateStr}', 'S')">${dest}</td>`;
                            skipS = count - 1;
                        } else {
                            const colorClass = status === '1' ? 'status-S-1' : (['A', 'M', 'CP', 'AT'].includes(status) ? 'status-A' : 'status-S-empty');
                            const displayStatus = ['M', 'CP', 'AT'].includes(status) ? status : (status === '1' ? '1' : (status === 'A' ? 'A' : (status ? status : '')));
                            html += `<td class="${cellClass} ${colorClass} pointage-cell" data-agent="${agent.id}" data-date="${dateStr}" data-shift="S" data-status="${status}">${displayStatus}</td>`;
                        }
                    });
                    html += `</tr>`;
                }
            });
        }

        // Add Agent Button at the bottom of the subsite
        html += `<tr ${displayStyle}>
            <td colspan="${periodDates.length + 2}" style="text-align: left; padding: 10px;">
                <button class="btn" style="background: transparent; border: 1px dashed var(--primary); color: var(--primary); font-size: 0.8rem; padding: 5px 15px;" onclick="openAddAgentModal('${sub.id}')">
                    <i class="fas fa-plus"></i> Ajouter un Agent Ici (${sub.name})
                </button>
            </td>
        </tr>`;

        html += `</tbody>`; // Close subsite tbody
    });

    html += `</table></div>`;
    container.innerHTML = html;
    
    // Update live KPIs
    if (document.getElementById('live-kpi-container')) {
        document.getElementById('live-kpi-container').style.display = 'flex';
        document.getElementById('kpi-p').textContent = globalP;
        document.getElementById('kpi-a').textContent = globalA;
        document.getElementById('kpi-off').textContent = (periodDates.length * subsites.reduce((sum, sub) => sum + sub.agents.length, 0)) - globalP - globalA;
    }
    
    const toolbar = document.getElementById('site-toolbar');
    if (toolbar) toolbar.classList.add('active');
}

function toggleSubsite(headerCell, subId) {
    const tbody = headerCell.closest('tbody');
    const isCollapsed = tbody.classList.toggle('subsite-collapsed');

    // Smoothly hide/show the rows except the header
    const rows = Array.from(tbody.querySelectorAll('tr')).filter(tr => !tr.classList.contains('subsite-header-row') && !tr.classList.contains('spacer-row'));
    rows.forEach(tr => {
        tr.style.display = isCollapsed ? 'none' : '';
    });

    // Remember preference
    localStorage.setItem(`collapsed_${subId}`, isCollapsed);
}

function toggleRadar(th) {
    // Clear all existing radar-active classes from TH headers
    document.querySelectorAll('th.radar-active').forEach(h => {
        if (h !== th) h.classList.remove('radar-active');
    });

    // Toggle the current one
    th.classList.toggle('radar-active');
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getStatus(attendance, date, shift) {
    if (!attendance || !Array.isArray(attendance)) return '';
    const found = attendance.find(a => a.date === date && a.shift_code === shift);
    return found ? found.status : '';
}

function getPresentDisplayValue() {
    return (isHistoricalView && historicalPresentDisplay === 'V') ? 'V' : '1';
}

function formatCellStatusText(status) {
    if (status === '1') return getPresentDisplayValue();
    if (status === 'A') return 'A';
    return '';
}

function askHistoricalDisplayMode() {
    const choice = prompt("Mode d'affichage des présences pour ce pointage précédent:\nSaisir 1 ou V.", historicalPresentDisplay);
    if (choice === null) return null;
    const mode = choice.trim().toUpperCase();
    if (mode !== '1' && mode !== 'V') {
        alert("Choix invalide. Merci de saisir 1 ou V.");
        return null;
    }
    return mode;
}

const attendanceUpdateQueue = [];
let attendanceFlushTimer = null;
let attendanceFlushInFlight = false;

function scheduleAttendanceFlush() {
    if (attendanceFlushTimer || attendanceFlushInFlight) return;
    attendanceFlushTimer = setTimeout(flushAttendanceUpdates, 120);
}

function enqueueAttendanceUpdate(update) {
    return new Promise((resolve, reject) => {
        attendanceUpdateQueue.push({ update, resolve, reject });
        scheduleAttendanceFlush();
    });
}

async function flushAttendanceUpdates() {
    if (attendanceFlushInFlight || attendanceUpdateQueue.length === 0) return;

    attendanceFlushInFlight = true;
    attendanceFlushTimer = null;
    const batch = attendanceUpdateQueue.splice(0, attendanceUpdateQueue.length);

    try {
        const res = await fetch('api.php?action=bulk_update_attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: batch.map(item => item.update) })
        });
        if (!res.ok) throw new Error('Bulk update failed');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Bulk update failed');
        batch.forEach(item => item.resolve());
        showToast("Pointage enregistré avec succès");
    } catch (e) {
        batch.forEach(item => item.reject(e));
    } finally {
        attendanceFlushInFlight = false;
        if (attendanceUpdateQueue.length > 0) {
            scheduleAttendanceFlush();
        }
    }
}

// Note: showToast is now a global function in dashboard.php

function applyAttendanceCellState(cellEl, shift, status) {
    if (!cellEl) return;
    cellEl.classList.remove('status-1', 'status-A', 'status-S-1', 'status-S-empty');

    if (status === '1') {
        cellEl.classList.add(shift === 'S' ? 'status-S-1' : 'status-1');
        cellEl.textContent = '1';
    } else if (['A', 'M', 'CP', 'AT'].includes(status)) {
        cellEl.classList.add('status-A');
        cellEl.textContent = status;
    } else if (status !== '') {
        // Support for hours (SP)
        cellEl.classList.add('status-1');
        cellEl.textContent = status;
    } else {
        if (shift === 'S') cellEl.classList.add('status-S-empty');
        cellEl.textContent = '';
    }
}

async function toggleStatus(agentId, date, shift, cellEl) {
    if (!cellEl || cellEl.dataset.pending === '1') return;

    const currentStatus = cellEl.dataset.status || '';
    let nextStatus = '';
    
    // Support toggle behavior but not for SP hours
    if (currentStatus === '') nextStatus = '1';
    else if (currentStatus === '1') nextStatus = 'A';
    else if (['A', 'M', 'CP', 'AT'].includes(currentStatus)) nextStatus = '';
    else nextStatus = '1';

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    cellEl.dataset.pending = '1';
    applyAttendanceCellState(cellEl, shift, nextStatus);
    cellEl.dataset.status = nextStatus;

    try {
        await enqueueAttendanceUpdate({ agent_id: agentId, date, shift_code: shift, status: nextStatus, period: periodStr });
    } catch (e) {
        applyAttendanceCellState(cellEl, shift, currentStatus);
        cellEl.dataset.status = currentStatus;
        alert("Erreur lors de la mise à jour du pointage.");
        console.error(e);
    } finally {
        cellEl.dataset.pending = '0';
    }
}

function filterAgents() {
    const term = document.getElementById('search-agent').value.toLowerCase();
    const rows = document.querySelectorAll('.agent-row-start');
    
    rows.forEach(row => {
        const name = row.getAttribute('data-agent-name') || '';
        const match = name.includes(term);
        
        row.style.display = match ? '' : 'none';
        
        let next = row.nextElementSibling;
        while (next && next.classList.contains('agent-row-extra')) {
            next.style.display = match ? '' : 'none';
            next = next.nextElementSibling;
        }
    });
}

function exportToCSV() {
    const table = document.querySelector('.attendance-card table');
    if (!table) return alert('Aucune donnée à exporter.');

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.style.display === 'none' || row.classList.contains('spacer-row')) return;
        
        let rowData = [];
        row.querySelectorAll('th, td').forEach(cell => {
            let text = cell.innerText.replace(/\r?\n|\r/g, ' ').trim();
            if (text.includes(',') || text.includes('"')) {
                text = '"' + text.replace(/"/g, '""') + '"';
            }
            rowData.push(text);
        });
        csvContent += rowData.join(',') + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const siteTitle = document.getElementById('current-site-title').textContent.trim() || 'export';
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    link.setAttribute("download", `Pointage_${siteTitle}_${periodStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Modals & UI Updates
function openAddSiteModal() { document.getElementById('modal-add-site').classList.add('active'); }

// Drag & Drop Paint and Context Menu Logic
let isPainting = false;
let paintStatus = '';
let paintShift = '';
let paintAgent = '';

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('main-grid-area');
    
    // Left click : Start painting
    grid.addEventListener('mousedown', (e) => {
        const cell = e.target.closest('.pointage-cell');
        if (!cell || e.button !== 0) return; // Only left click on pointage cells
        
        const shift = cell.dataset.shift;
        if (shift === 'S') {
            const hours = prompt("Heures supplémentaires (ex: 2, 4) ou laissez vide pour effacer:");
            if (hours !== null) {
                const h = hours.trim();
                toggleStatusDirect(cell.dataset.agent, cell.dataset.date, shift, cell, h);
            }
            return; // Don't paint SP
        }

        const currentStatus = cell.dataset.status || '';
        let nextStatus = '';
        if (currentStatus === '') nextStatus = '1';
        else if (currentStatus === '1') nextStatus = 'A';
        else nextStatus = ''; 
        
        isPainting = true;
        paintStatus = nextStatus;
        paintShift = shift;
        paintAgent = cell.dataset.agent;

        toggleStatusDirect(paintAgent, cell.dataset.date, shift, cell, paintStatus);
    });

    // Hover : Continue painting
    grid.addEventListener('mouseover', (e) => {
        if (!isPainting) return;
        const cell = e.target.closest('.pointage-cell');
        if (!cell) return;
        
        if (cell.dataset.agent === paintAgent && cell.dataset.shift === paintShift) {
            if (cell.dataset.status !== paintStatus) {
                toggleStatusDirect(paintAgent, cell.dataset.date, paintShift, cell, paintStatus);
            }
        }
    });

    window.addEventListener('mouseup', () => {
        isPainting = false;
    });

    // Right click : Absence menu
    grid.addEventListener('contextmenu', (e) => {
        const cell = e.target.closest('.pointage-cell');
        if (!cell) return;
        e.preventDefault();
        
        let menu = document.getElementById('absence-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'absence-context-menu';
            menu.style.cssText = 'position:fixed; background:var(--bg-card); border:1px solid var(--border); box-shadow:0 4px 12px rgba(0,0,0,0.5); border-radius:8px; z-index:10000; overflow:hidden; display:flex; flex-direction:column;';
            
            const options = [
                { code: 'A', label: 'Absence Injustifiée', color: 'var(--danger)' },
                { code: 'M', label: 'Maladie (M)', color: '#f59e0b' },
                { code: 'CP', label: 'Congé Payé (CP)', color: '#3b82f6' },
                { code: 'AT', label: 'Accident Travail (AT)', color: '#8b5cf6' },
                { code: '', label: 'Effacer (Repos)', color: 'var(--text-muted)' }
            ];
            
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.style.cssText = `padding: 10px 15px; border:none; background:transparent; color:white; text-align:left; cursor:pointer; font-size:0.85rem; border-bottom:1px solid rgba(255,255,255,0.05);`;
                btn.innerHTML = `<span style="display:inline-block; width:12px; height:12px; background:${opt.color}; border-radius:50%; margin-right:8px;"></span> ${opt.label}`;
                btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.1)';
                btn.onmouseout = () => btn.style.background = 'transparent';
                btn.onclick = () => {
                    const targetCell = menu.targetCell;
                    toggleStatusDirect(targetCell.dataset.agent, targetCell.dataset.date, targetCell.dataset.shift, targetCell, opt.code);
                    menu.style.display = 'none';
                };
                menu.appendChild(btn);
            });
            document.body.appendChild(menu);
        }
        
        menu.targetCell = cell;
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('absence-context-menu');
        if (menu && menu.style.display === 'flex' && !e.target.closest('#absence-context-menu')) {
            menu.style.display = 'none';
        }
    });
});

async function toggleStatusDirect(agentId, date, shift, cellEl, forcedStatus) {
    if (!cellEl || cellEl.dataset.pending === '1') return;
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    const currentStatus = cellEl.dataset.status || '';
    
    cellEl.dataset.pending = '1';
    applyAttendanceCellState(cellEl, shift, forcedStatus);
    cellEl.dataset.status = forcedStatus;

    try {
        await enqueueAttendanceUpdate({ agent_id: agentId, date, shift_code: shift, status: forcedStatus, period: periodStr });
    } catch (e) {
        applyAttendanceCellState(cellEl, shift, currentStatus);
        cellEl.dataset.status = currentStatus;
        console.error(e);
    } finally {
        cellEl.dataset.pending = '0';
    }
}

function openAddAgentModal(subsiteId) {
    document.getElementById('target-subsite-id').value = subsiteId;
    document.getElementById('modal-add-agent').classList.add('active');
}

function openAddSubsiteModal() {
    document.getElementById('modal-add-subsite').classList.add('active');
}

function openLegendModal() {
    document.getElementById('modal-legend').classList.add('active');
}

function openRenameSubsiteModal(id, currentName) {
    document.getElementById('rename-subsite-id').value = id;
    document.getElementById('rename-subsite-name').value = currentName;
    document.getElementById('modal-rename-subsite').classList.add('active');
}

function openFunctionModal(agentId) {
    document.getElementById('function-target-agent-id').value = agentId;
    const container = document.getElementById('function-modal-options');
    if (container) {
        container.innerHTML = systemFunctions.map(f => `
            <button class="btn" style="background: rgba(255,255,255,0.1); color: white;"
                onclick="updateAgentInfo('function', '${f.id}')">${f.id} (${f.name})</button>
        `).join('');
    }
    document.getElementById('modal-agent-function').classList.add('active');
}

function openShiftModal(agentId, currentType) {
    document.getElementById('shift-target-agent-id').value = agentId;
    const modal = document.getElementById('modal-agent-shift');
    const patternArea = document.getElementById('pattern-options');
    modal.classList.add('active');

    if (['24h', '48h', '72h', 'Jour', 'Nuit'].includes(currentType)) {
        patternArea.style.display = 'block';
        renderPatternOptions(agentId, currentType);
    } else {
        patternArea.style.display = 'none';
    }
}

function renderPatternOptions(agentId, type) {
    const list = document.getElementById('pattern-list');
    list.innerHTML = '';

    let cycleLen, workDays;
    if (type === '24h') { cycleLen = 2; workDays = 1; }
    else if (type === '48h') { cycleLen = 4; workDays = 2; }
    else if (type === '72h') { cycleLen = 6; workDays = 3; }
    else {
        // For Jour/Nuit (Fixed)
        cycleLen = 1; workDays = 1;
    }

    const startDay = appSettings.cycle_start;
    const nextDay = startDay + 1;

    // For fixed shifts, we only show one option: fill all
    if (type === 'Jour' || type === 'Nuit') {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.textAlign = 'left';
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = 'white';
        btn.style.marginBottom = '8px';
        btn.style.width = '100%';
        btn.innerHTML = `<span style="font-family: 'Segoe UI Emoji';">🟢🟢🟢🟢🟢🟢</span>  <span style="font-size:0.85rem; margin-left:10px;">Tout remplir en Présence</span>`;
        btn.onclick = () => applyPattern(agentId, 1, 1, 0, type); // Cycle 1, Work 1, Offset 0 = Full fill
        list.appendChild(btn);
        return;
    }

    // Define specifically requested patterns: Start Work/Rest on 21 or 22
    // These correspond to offsets 0, 1, workDays, and workDays+1
    const allowed = [0, 1, workDays, workDays + 1].filter((v, i, a) => a.indexOf(v) === i && v < cycleLen);

    allowed.forEach(offset => {
        let preview = "";
        for (let i = 0; i < 6; i++) {
            let pos = (i - offset) % cycleLen;
            if (pos < 0) pos += cycleLen;
            preview += (pos < workDays) ? "🟢" : "⚪";
        }

        let desc = "";
        if (offset === 0) desc = `Commencer Travail le ${startDay}`;
        else if (offset === 1) desc = `Commencer Travail le ${nextDay}`;
        else if (offset === workDays) desc = `Commencer Repos le ${startDay}`;
        else if (offset === workDays + 1) desc = `Commencer Repos le ${nextDay}`;

        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.textAlign = 'left';
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = 'white';
        btn.style.marginBottom = '8px';
        btn.style.width = '100%';
        btn.innerHTML = `<span style="font-family: 'Segoe UI Emoji';">${preview}</span>  <span style="font-size:0.85rem; margin-left:10px;">${desc}</span>`;
        btn.onclick = () => applyPattern(agentId, cycleLen, workDays, offset, type);
        list.appendChild(btn);
    });
}

async function updateAgentInfo(field, value) {
    const agentId = field === 'function' ? document.getElementById('function-target-agent-id').value : document.getElementById('shift-target-agent-id').value;
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    await fetch('api.php?action=update_agent_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, field, value, period: periodStr })
    });

    closeModals();
    loadSiteData(currentSiteId);
}

async function toggleSPRow(agentId, currentState) {
    await fetch('api.php?action=update_agent_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, field: 'has_sp', value: !currentState })
    });
    loadSiteData(currentSiteId);
}

async function applyPattern(agentId, cycleLen, workDays, offset, shiftType) {
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    try {
        const res = await fetch('api.php?action=apply_batch_rotation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_id: agentId,
                period: periodStr,
                cycle: cycleLen,
                work: workDays,
                offset: offset,
                shift_type: shiftType
            })
        });

        const data = await res.json();
        if (data.success) {
            alert('Planning généré !');
            closeModals();
            loadSiteData(currentSiteId);
        } else {
            alert('Erreur: ' + data.message);
        }
    } catch (e) {
        console.error("Pattern apply error:", e);
        alert("Erreur lors de la génération du planning.");
    }
}


function closeModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }

async function addSite() {
    const name = document.getElementById('new-site-name').value;
    if (!name) return;
    const res = await fetch('api.php?action=add_site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
        closeModals();
        loadSites();
        document.getElementById('new-site-name').value = '';
    } else {
        alert(data.message);
    }
}

async function addSubsite() {
    const name = document.getElementById('new-subsite-name').value;
    if (!name) return;
    const res = await fetch('api.php?action=add_subsite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: currentSiteId, name })
    });
    const data = await res.json();
    if (data.success) {
        closeModals();
        loadSiteData(currentSiteId);
        document.getElementById('new-subsite-name').value = '';
    } else {
        alert(data.message);
    }
}

async function renameSubsite() {
    const id = document.getElementById('rename-subsite-id').value;
    const name = document.getElementById('rename-subsite-name').value;
    if (!name) return;
    const res = await fetch('api.php?action=rename_subsite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsite_id: id, name })
    });
    const data = await res.json();
    if (data.success) {
        closeModals();
        loadSiteData(currentSiteId);
    } else {
        alert(data.message);
    }
}

async function deleteSubsite(subsiteId, subsiteName) {
    if (!confirm(`Voulez-vous vraiment supprimer le sous-site "${subsiteName}" ? Cette action est irréversible.`)) return;

    const res = await fetch('api.php?action=delete_subsite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsite_id: subsiteId })
    });
    const data = await res.json();
    if (data.success) {
        localStorage.removeItem(`collapsed_${subsiteId}`);
        loadSiteData(currentSiteId);
    } else {
        alert(data.message || "Impossible de supprimer ce sous-site.");
    }
}

async function addAgent() {
    const subsiteId = document.getElementById('target-subsite-id').value;
    const name = document.getElementById('new-agent-name').value;
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    if (!name) return;

    console.log("Adding agent:", { subsiteId, name });

    try {
        const res = await fetch('api.php?action=add_agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subsite_id: subsiteId, name, period: periodStr })
        });
        const data = await res.json();
        console.log("Response from add_agent:", data);
        if (data.success) {
            closeModals();
            loadSiteData(currentSiteId);
        } else {
            alert("Erreur: " + (data.message || "Impossible d'ajouter l'agent"));
        }
    } catch (err) {
        console.error("Fetch error in addAgent:", err);
        alert("Erreur de communication avec le serveur");
    }
}

async function deleteAgent(id, name) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${name} ?`)) return;

    const res = await fetch('api.php?action=delete_agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: id })
    });
    const data = await res.json();
    if (data.success) {
        loadSiteData(currentSiteId);
    } else {
        alert(data.message);
    }
}

async function archiveAllSites() {
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    if (!confirm(`Voulez-vous enregistrer et archiver définitivement le pointage de TOUS les sites pour la période ${periodStr} ?`)) return;

    try {
        const res = await fetch('api.php?action=archive_all_sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ period: periodStr })
        });
        const data = await res.json();
        if (data.success) {
            alert('Tous les sites ont été archivés avec succès pour cette période !');
        } else {
            alert('Erreur: ' + data.message);
        }
    } catch (e) {
        console.error("Archive error:", e);
        alert("Erreur lors de l'archivage.");
    }
}

async function loadMessages() {
    const res = await fetch('api.php?action=get_messages');
    const messages = await res.json();
    const countSpan = document.getElementById('notif-count');
    const list = document.getElementById('notifications-list');

    if (messages.length > 0) {
        countSpan.textContent = messages.length;
        countSpan.style.display = 'inline-block';
    } else {
        countSpan.classList.remove('active');
    }

    list.innerHTML = messages.map(m => `
        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 10px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="color: var(--primary);">${m.service}</strong>
                <small style="color: var(--text-muted);">${m.created_at}</small>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 10px;">
                <strong>${m.from_user}</strong> a enregistré le pointage de <strong>${m.site_name}</strong> pour <strong>${m.period}</strong>.
            </p>
            <button class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 12px;" onclick="loadHistoricalReport('${m.site_id}', '${m.period}', '${m.site_name.replace(/'/g, "\\'")}')">
                <i class="fas fa-eye"></i> Visionner
            </button>
        </div>
    `).join('') || '<p style="text-align:center; padding: 2rem; color: var(--text-muted);">Aucun pointage précédent enregistré</p>';
}

async function loadHistoricalReport(siteId, periodStr, siteName) {
    const selectedMode = askHistoricalDisplayMode();
    if (!selectedMode) return;
    historicalPresentDisplay = selectedMode;
    isHistoricalView = true;

    // Switch state to the historical period
    const [year, month] = periodStr.split('-');
    currentPeriod = new Date(parseInt(year), parseInt(month) - 1, 1);
    currentSiteId = siteId;

    // Update UI
    updatePeriodDisplay();
    document.getElementById('current-site-title').textContent = siteName;

    // Highlight correct site in sidebar
    document.querySelectorAll('.site-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(siteId)) {
            btn.classList.add('active');
        }
    });

    closeModals();
    loadSiteData(siteId);
}

function openNotificationsModal() {
    loadMessages();
    document.getElementById('modal-notifications').classList.add('active');
}

function openAdminModal() {
    window.location.href = 'settings.php?section=services';
}

function openSettingsModal() {
    document.getElementById('setting-cycle-start').value = appSettings.cycle_start;
    document.getElementById('setting-cycle-end').value = appSettings.cycle_end;
    document.getElementById('modal-settings').classList.add('active');
}

async function saveSettings() {
    const start = document.getElementById('setting-cycle-start').value;
    const end = document.getElementById('setting-cycle-end').value;

    const res = await fetch('api.php?action=save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle_start: start, cycle_end: end })
    });

    const data = await res.json();
    if (data.success) {
        appSettings.cycle_start = parseInt(start);
        appSettings.cycle_end = parseInt(end);
        closeModals();
        updatePeriodDisplay();
        alert('Paramètres enregistrés !');
    } else {
        alert(data.message);
    }
}

function logout() {
    fetch('api.php?action=logout').then(() => window.location.href = 'index.php');
}
async function initializeMonth() {
    if (!currentSiteId) return;
    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    if (!confirm("⚠️ ATTENTION : Ceci va ÉCRASER toutes les présences manuelles actuelles de ce mois et remettre le planning par défaut.\n\nÊtes-vous vraiment sûr de vouloir continuer ?")) return;

    try {
        const res = await fetch('api.php?action=init_site_period', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site_id: currentSiteId, period: periodStr })
        });

        const data = await res.json();
        if (data.success) {
            await loadSiteData(currentSiteId);
            alert('Initialisation terminée avec succès !');
        } else {
            alert('Erreur: ' + (data.message || 'Serveur occupé'));
        }
    } catch (e) {
        console.error("Initialization error:", e);
        alert("Erreur lors de l'initialisation : " + e.message);
    }
}
async function openRenameSiteModal(siteId, currentName) {
    const newName = prompt("Nouveau nom pour le site :", currentName);
    if (!newName || newName === currentName) return;

    const res = await fetch('api.php?action=rename_site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteId, name: newName })
    });
    const data = await res.json();
    if (data.success) {
        if (currentSiteId == siteId) {
            document.getElementById('current-site-title').textContent = newName;
        }
        loadSites();
    } else {
        alert(data.message);
    }
}

async function openRenameSubsiteModal(subsiteId, currentName) {
    const newName = prompt("Nouveau nom pour la zone :", currentName);
    if (!newName || newName === currentName) return;

    const res = await fetch('api.php?action=rename_subsite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsite_id: subsiteId, name: newName })
    });
    const data = await res.json();
    if (data.success) {
        loadSiteData(currentSiteId);
    } else {
        alert(data.message);
    }
}

// ========== MUTATION MANAGEMENT ==========

function openMutationModal(agentId) {
    document.getElementById('mutation-target-agent-id').value = agentId;
    // Clear previous values
    document.getElementById('mutation-destination').value = '';
    document.getElementById('mutation-start').value = '';
    document.getElementById('mutation-end').value = '';
    document.getElementById('modal-mutation').classList.add('active');
}

async function submitMutation() {
    const aid = document.getElementById('mutation-target-agent-id').value;
    const dest = document.getElementById('mutation-destination').value;
    const start = document.getElementById('mutation-start').value;
    const end = document.getElementById('mutation-end').value;

    if (!dest || !start || !end) {
        alert("Veuillez remplir tous les champs (Destination, Date Début, Date Fin).");
        return;
    }

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    console.log("Submitting mutation:", { aid, dest, start, end, periodStr });

    try {
        const res = await fetch('api.php?action=apply_mutation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent_id: aid,
                start_date: start,
                end_date: end,
                destination: dest,
                period: periodStr
            })
        });

        const text = await res.text();
        console.log("Server response raw:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error("Réponse du serveur non valide (JSON attendu).");
        }

        if (data.success) {
            alert("Mutation enregistrée avec succès !");
            closeModals();
            loadSiteData(currentSiteId);
        } else {
            alert("Erreur serveur: " + (data.message || "Action impossible"));
        }
    } catch (e) {
        console.error("Mutation error:", e);
        alert("Erreur lors de l'enregistrement: " + e.message);
    }
}

async function clearMutation(agentId, date, shift) {
    if (!confirm("Voulez-vous supprimer cette mutation ?")) return;

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
    await fetch('api.php?action=update_attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_id: agentId,
            date: date,
            shift_code: shift,
            status: '',
            period: periodStr
        })
    });
    loadSiteData(currentSiteId);
}

async function clearSiteMutations() {
    if (!currentSiteId) return;
    if (!confirm("Voulez-vous supprimer TOUTES les mutations de ce site pour ce mois ?")) return;

    const periodStr = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;

    try {
        const res = await fetch('api.php?action=clear_site_mutations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site_id: currentSiteId, period: periodStr })
        });
        const data = await res.json();
        if (data.success) {
            alert("Toutes les mutations ont été supprimées.");
            loadSiteData(currentSiteId);
        } else {
            alert("Erreur: " + data.message);
        }
    } catch (e) {
        console.error("Clear all mutations error:", e);
        alert("Erreur lors de la suppression.");
    }
}
