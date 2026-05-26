<?php
session_start();
include 'lang.php';
include 'db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit();
}
$__perms = getUserPermissionsByEmail($_SESSION['user_id']);
$_SESSION['permissions'] = $__perms;
if (($_SESSION['user_role'] ?? '') !== 'admin' && empty($__perms['can_view_archives'])) {
    header('Location: dashboard.php');
    exit();
}
$subscriptionState = getUserSubscriptionState($_SESSION['user_id']);
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo __('archives_title'); ?> - Pontage Pro</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/scrollbar.css">
    <link rel="stylesheet" href="assets/css/subscription-banner.css">
    <style>
        :root {
            --primary: #6366f1;
            --bg: #0f172a;
            --bg-sidebar: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --border: rgba(255, 255, 255, 0.1);
            --success: #22c55e;
            --danger: #ef4444;
            --warning: #eab308;
            --card-bg: rgba(30, 41, 59, 0.7);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Sidebar similar to dashboard */
        .sidebar {
            width: 280px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 1.5rem;
            flex-shrink: 0;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: fixed;
            height: 100vh;
            z-index: 1000;
            left: 0;
            top: 0;
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
        }

        .sidebar.collapsed {
            left: -320px;
            box-shadow: none;
        }

        .sidebar-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        .sidebar:not(.collapsed) ~ .sidebar-overlay {
            opacity: 1;
            pointer-events: all;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--primary);
        }

        .nav-section {
            margin-bottom: 2rem;
        }

        .nav-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 1rem;
            letter-spacing: 0.05em;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.75rem 1rem;
            text-decoration: none;
            color: var(--text-muted);
            border-radius: 12px;
            transition: all 0.2s;
            margin-bottom: 0.5rem;
            cursor: pointer;
        }

        .nav-item:hover,
        .nav-item.active {
            background: rgba(99, 102, 241, 0.1);
            color: var(--text);
        }

        .main-content {
            flex-grow: 1;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        h2 {
            font-weight: 600;
            font-size: 1.8rem;
        }

        .archive-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
        }

        .archive-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
            backdrop-filter: blur(10px);
        }

        .archive-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border-color: var(--primary);
        }

        /* New Archive Glow Effect */
        @keyframes pulse-glow {
            0% {
                box-shadow: 0 0 5px rgba(99, 102, 241, 0.2);
                border-color: rgba(99, 102, 241, 0.3);
            }

            50% {
                box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
                border-color: var(--primary);
            }

            100% {
                box-shadow: 0 0 5px rgba(99, 102, 241, 0.2);
                border-color: rgba(99, 102, 241, 0.3);
            }
        }

        .archive-card.is-new {
            animation: pulse-glow 2s infinite;
            border-width: 2px;
            position: relative;
        }

        .archive-card.is-new::before {
            content: 'NOUVEAU';
            position: absolute;
            top: -10px;
            right: 20px;
            background: var(--primary);
            color: white;
            font-size: 0.65rem;
            font-weight: 800;
            padding: 2px 10px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
            z-index: 10;
        }

        .archive-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .period-badge {
            background: rgba(99, 102, 241, 0.2);
            color: var(--primary);
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.85rem;
        }

        .archive-meta {
            color: var(--text-muted);
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
        }

        .archive-meta div {
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn {
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            text-decoration: none;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            opacity: 0.9;
            transform: scale(1.02);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        .btn-danger:hover {
            background: var(--danger);
            color: white;
        }

        /* Modal for viewing details */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .modal-content {
            background: var(--bg-sidebar);
            border: 1px solid var(--border);
            border-radius: 24px;
            width: 100%;
            max-width: 1200px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .modal-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-body {
            padding: 2rem;
            overflow-y: auto;
            flex-grow: 1;
        }

        .site-section {
            margin-bottom: 3rem;
        }

        .site-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--primary);
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }

        th,
        td {
            text-align: center;
            padding: 10px;
            border: 1px solid var(--border);
        }

        th {
            background: rgba(255, 255, 255, 0.05);
        }

        .present {
            color: var(--success);
            font-weight: bold;
        }

        .absent {
            color: var(--danger);
            font-weight: bold;
        }

        .present.sp {
            color: var(--primary) !important;
        }

        .presence-cell {
            background: rgba(34, 197, 94, 0.22);
            box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.45);
        }

        @media print {
            @page {
                size: landscape;
                margin: 5mm;
            }

            .sidebar,
            .btn,
            .nav-item,
            header,
            p,
            .modal-header p,
            .modal-header div:last-child {
                display: none !important;
            }

            body {
                background: white;
                color: black;
                padding: 0;
                margin: 0;
                width: 100%;
            }

            .main-content {
                padding: 0;
                max-width: 100%;
                width: 100%;
                border: none;
                margin: 0;
            }

            .modal {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                background: white !important;
                padding: 0 !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
            }

            .modal-content {
                border: none !important;
                background: white !important;
                box-shadow: none !important;
                max-height: none !important;
                overflow: visible !important;
                width: 100% !important;
                margin: 0 !important;
            }

            .modal-header {
                border-bottom: 2px solid black !important;
                padding: 5px 0 !important;
                margin-bottom: 10px !important;
            }

            .modal-header h3 {
                color: black !important;
                font-size: 18px !important;
                text-align: center !important;
                width: 100% !important;
                margin: 0 !important;
            }

            .site-section {
                page-break-inside: avoid;
                margin-bottom: 15px;
                width: 100%;
            }

            .site-title {
                color: black !important;
                border-bottom: 1px solid black !important;
                margin-top: 10px;
                font-size: 14px !important;
            }

            h5 {
                color: black !important;
                margin-bottom: 5px;
                font-size: 12px !important;
            }

            table {
                width: 100% !important;
                border: 1px solid black !important;
                color: black !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
            }

            th,
            td {
                border: 1px solid black !important;
                color: black !important;
                padding: 2px !important;
                font-size: 8px !important;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            th {
                background: #f0f0f0 !important;
                -webkit-print-color-adjust: exact;
            }

            /* First columns width */
            th:nth-child(1),
            td:nth-child(1) {
                width: 120px !important;
                text-align: left !important;
            }

            th:nth-child(2),
            td:nth-child(2) {
                width: 25px !important;
            }

            /* Daily columns */
            th:not(:nth-child(-n+2)),
            td:not(:nth-child(-n+2)) {
                width: 25px !important;
            }

            .present,
            .absent {
                color: black !important;
                font-weight: bold !important;
                font-size: 10px !important;
            }

            .action-icon,
            .fa-trash-can,
            .fa-edit {
                display: none !important;
            }

            .site-section h5 i {
                display: none;
            }
        }
    </style>
</head>

<body>
    <aside class="sidebar collapsed">
        <div class="logo">
            <i class="fas fa-shield-halved"></i>
            <span>Pontage Pro</span>
        </div>

        <div class="nav-section">
            <div class="nav-title">Navigation</div>
            <a href="dashboard.php" class="nav-item">
                <i class="fas fa-arrow-left"></i>
                <span><?php echo __('back_dashboard'); ?></span>
            </a>
            <a href="archives.php" class="nav-item active">
                <i class="fas fa-history"></i>
                <span><?php echo __('previous_records'); ?></span>
            </a>
        </div>

        <div style="margin-top: auto;">
            <div class="nav-item" onclick="window.location.href='api.phpaction=logout'" style="color: var(--danger);">
                <i class="fas fa-sign-out-alt"></i>
                <span><?php echo __('logout'); ?></span>
            </div>
        </div>
    </aside>
    <div class="sidebar-overlay" onclick="toggleSidebar()"></div>

    <main class="main-content">
        <header>
            <div style="display: flex; align-items: center; gap: 15px;">
                <button class="btn" onclick="toggleSidebar()" style="background: rgba(255,255,255,0.05); color: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border);"><i class="fas fa-bars"></i></button>
                <div>
                    <h2><?php echo __('archives_title'); ?></h2>
                    <p style="color: var(--text-muted);"><?php echo __('choose_site_sidebar'); ?></p>
                </div>
            </div>
        </header>
        <div id="subscription-banner" class="subscription-banner" style="display:none;">
            <div class="txt" id="subscription-banner-text"></div>
            <a href="subscription.php" id="btn-go-premium" class="btn btn-primary"
                style="text-decoration:none; padding:0.4rem 0.7rem; font-size: 0.85rem;">Passer en Premium</a>
        </div>

        <div class="lock-target">
            <div class="archive-grid" id="archives-list">
                <!-- Loaded via JS -->
                <div style="grid-column: 1/-1; text-align: center; padding: 5rem; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p style="margin-top: 1rem;"><?php echo __('loading_archives'); ?></p>
                </div>
            </div>
        </div>
    </main>

    <!-- Modal for Viewing Archive -->
    <div id="modal-view-archive" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h3 id="view-title"><?php echo __('archive_details'); ?></h3>
                    <p id="view-meta" style="font-size: 0.8rem; color: var(--text-muted);"></p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="presence-display-mode" class="btn"
                        style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 0.75rem 1rem;"
                        onchange="setArchivePresenceMode(this.value)">
                        <option value="V">Présence: V</option>
                        <option value="1">Présence: 1</option>
                    </select>
                    <select id="print-site-filter" class="btn"
                        style="background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); padding: 0.75rem 1rem;"
                        onchange="filterPrintSite()">
                        <option value="all">Tous les Sites</option>
                    </select>
                    <button class="btn" onclick="window.print()"
                        style="background: rgba(255,255,255,0.1); color: white;">
                        <i class="fas fa-print"></i> <?php echo __('print'); ?>
                    </button>
                    <button class="btn" onclick="closeModal()" style="background: var(--danger); color: white;">&times;
                        <?php echo __('close'); ?></button>
                </div>
            </div>
            <div class="modal-body" id="view-body">
                <!-- Content generated via JS -->
            </div>
        </div>
    </div>

    <script src="assets/js/subscription-banner.js"></script>
    <script>
        window.SUBSCRIPTION_STATE = <?php echo json_encode($subscriptionState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;

        document.addEventListener('DOMContentLoaded', loadArchives);
        document.addEventListener('DOMContentLoaded', () => initSubscriptionBanner({
            lockSelector: '.lock-target',
            trialTextPrefix: 'Mode gratuit (Essai 15 jours) : il vous reste ',
            trialTextSuffix: ' jour(s) avant expiration.'
        }));
        let currentArchive = null;
        let archivePresenceMode = 'V';

        async function loadArchives() {
            const res = await fetch('api.phpaction=get_archives');
            const archives = await res.json();
            const list = document.getElementById('archives-list');

            // Get viewed archives from localStorage
            const viewedArchives = JSON.parse(localStorage.getItem('viewed_archives') || '[]');

            if (archives.length === 0) {
                list.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 5rem; color: var(--text-muted); background: var(--card-bg); border-radius: 24px; border: 1px dashed var(--border);">
                        <i class="fas fa-box-open fa-3x"></i>
                        <p style="margin-top: 1rem; font-size: 1.1rem;">Aucune archive enregistrée pour le moment.</p>
                        <p style="font-size: 0.9rem;">Cliquez sur "Enregistrer Pointage" dans le Dashboard pour créer une archive de tous les sites.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = archives.map(a => {
                const isViewed = viewedArchives.includes(a.id);
                const isNewClass = !isViewed  'is-new' : '';

                return `
                    <div class="archive-card ${isNewClass}" id="archive-${a.id}">
                        <div class="archive-header">
                            <span class="period-badge">${formatPeriod(a.period)}</span>
                            <i class="fas fa-folder-closed" style="color: var(--primary);"></i>
                        </div>
                        <div class="archive-meta">
                           <div><i class="fas fa-calendar-day"></i> Archivé le : ${a.archived_at}</div>
                           <div><i class="fas fa-user-edit"></i> Par : ${a.archived_by}</div>
                            <div><i class="fas fa-location-dot"></i> ${a.sites_count} sites inclus</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                           <button class="btn btn-primary" onclick="viewArchive('${a.id}')" style="flex: 1;">
                                <i class="fas fa-eye"></i> Visionner
                            </button>
                           <?php if ($_SESSION['user_role'] == 'admin'): ?>
                           <button class="btn btn-danger" onclick="deleteArchive('${a.id}')" style="padding: 0.75rem 1rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                            <?php endif; ?>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function viewArchive(id) {
            // Show loading state in modal if needed or just fetch
            const btn = event.currentTarget;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            btn.disabled = true;

            try {
                const res = await fetch(`api.phpaction=get_archive_detail&id=${id}`);
                const archive = await res.json();

                if (archive.success === false) {
                    alert(archive.message);
                    return;
                }

                document.getElementById('view-title').textContent = `Pointage Global - ${formatPeriod(archive.period)}`;
                document.getElementById('view-meta').textContent = `Archivé par ${archive.archived_by} le ${archive.archived_at}`;
                currentArchive = archive;
                const modeSelect = document.getElementById('presence-display-mode');
                if (modeSelect) modeSelect.value = archivePresenceMode;

                renderDetailedTable(archive);
                document.getElementById('modal-view-archive').style.display = 'flex';

                // Mark as viewed
                markAsViewed(id);
            } catch (e) {
                console.error("Error loading archive detail:", e);
                alert("Erreur lors du chargement des détails.");
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }

        function renderDetailedTable(archive) {
            const body = document.getElementById('view-body');
            body.innerHTML = '';
            const presentChar = archivePresenceMode === '1' ? '1' : 'V';

            // Populate filter dropdown
            const filter = document.getElementById('print-site-filter');
            filter.innerHTML = '<option value="all">Tous les Sites</option>';
            archive.sites.forEach(s => {
                filter.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });

            const settings = { cycle_start: 21, cycle_end: 20 }; // Default or fetch
            const periodDates = calculateDatesForPeriod(archive.period, settings);

            archive.sites.forEach(site => {
                const section = document.createElement('div');
                section.className = 'site-section';
                section.setAttribute('data-site-id', site.id);

                let html = `<h4 class="site-title">${site.name}</h4>`;

                site.subsites.forEach(sub => {
                    if (sub.agents.length === 0) return;

                    html += `<div style="margin-bottom: 30px; overflow-x: auto;">
                        <h5 style="margin-bottom: 15px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-layer-group"></i> ${sub.name}
                        </h5>
                        <table style="min-width: 1000px;">
                            <thead>
                                <tr>
                                    <th style="width: 250px; text-align: left;">Agent</th>
                                    <th style="width: 60px;">Shift</th>`;

                    const lang = document.documentElement.lang || 'fr';
                    const dayNamesShortFr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                    const dayNamesShortEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const dayNamesShort = lang === 'en'  dayNamesShortEn: dayNamesShortFr;
                    periodDates.forEach(date => {
                        html += `<th style="width: 35px;">${date.getDate()}<br><small style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">${dayNamesShort[date.getDay()]}</small></th>`;
                    });

                    html += `</tr></thead><tbody>`;

                    sub.agents.forEach(agent => {
                        const aid = agent.id;
                        // Determine which shifts should be shown
                        const validShifts = ['J', 'N', 'S'].filter(shift => {
                            if (shift === 'S') return archive.attendance[aid] && archive.attendance[aid]['S'] && Object.keys(archive.attendance[aid]['S']).length > 0;
                            const isTypeMatch = agent.shift_type === (shift === 'J' ? 'Jour' : 'Nuit');
                            const isRotative = ['24h', '48h', '72h'].includes(agent.shift_type);
                            return isTypeMatch || isRotative;
                        });

                        validShifts.forEach((shift, index) => {
                            html += `<tr>`;

                            // Merge the name column using rowspan if multiple shifts are shown
                            if (index === 0) {
                                html += `<td rowspan="${validShifts.length}" style="text-align: left; font-weight: 500; border-bottom: 2px solid var(--border);">${agent.name}</td>`;
                            }

                            html += `<td style="font-weight: 600; color: var(--primary);">${shift}</td>`;

                            periodDates.forEach(date => {
                                const ds = date.toISOString().split('T')[0];
                                const status = (archive.attendance[aid] && archive.attendance[aid][shift])  archive.attendance[aid][shift][ds]: '';

                                let display = '';
                                let tdClass = '';
                                if (status === '1') {
                                    const spClass = (shift === 'S') ? 'sp' : '';
                                    display = `<span class="present ${spClass}">${presentChar}</span>`;
                                    tdClass = ' class="presence-cell"';
                                } else if (status === 'A') {
                                    display = '<span class="absent">A</span>';
                                }

                                html += `<td${tdClass}>${display}</td>`;
                            });
                            html += `</tr>`;
                        });
                    });

                    html += `</tbody></table></div>`;
                });

                section.innerHTML = html;
                body.appendChild(section);
            });
        }

        function calculateDatesForPeriod(periodStr, settings) {
            const [year, month] = periodStr.split('-').map(Number);
            const periodDates = [];
            const startDay = settings.cycle_start;
            const endDay = settings.cycle_end;

            const start = new Date(year, month - 1, startDay, 12, 0, 0);
            let current = new Date(start);

            for (let i = 0; i < 35; i++) {
                periodDates.push(new Date(current));
                current.setDate(current.getDate() + 1);
                if (current.getDate() === endDay + 1) break;
            }
            return periodDates;
        }

        async function deleteArchive(id) {
            if (!confirm("Supprimer définitivement cette archive ")) return;
            const res = await fetch('api.phpaction=delete_archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if ((await res.json()).success) {
                loadArchives();
            }
        }

        function setArchivePresenceMode(mode) {
            archivePresenceMode = (mode === '1') ? '1' : 'V';
            if (currentArchive) {
                renderDetailedTable(currentArchive);
            }
        }

        function closeModal() {
            document.getElementById('modal-view-archive').style.display = 'none';
            currentArchive = null;
        }

        function markAsViewed(id) {
            let viewed = JSON.parse(localStorage.getItem('viewed_archives') || '[]');
            if (!viewed.includes(id)) {
                viewed.push(id);
                localStorage.setItem('viewed_archives', JSON.stringify(viewed));

                // Remove the animation from the UI immediately
                const card = document.getElementById(`archive-${id}`);
                if (card) card.classList.remove('is-new');
            }
        }

        function filterPrintSite() {
            const val = document.getElementById('print-site-filter').value;
            document.querySelectorAll('.site-section').forEach(s => {
                if (val === 'all' || s.getAttribute('data-site-id') === val) {
                    s.style.display = 'block';
                } else {
                    s.style.display = 'none';
                }
            });
        }

        function formatPeriod(p) {
            const [y, m] = p.split('-');
            const lang = document.documentElement.lang || 'fr';
            const monthsFr = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
            const monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const months = lang === 'en'  monthsEn: monthsFr;
            return `${months[parseInt(m) - 1]} ${y}`;
        }

        function generateDates(p) {
            return Array.from({ length: 31 }, (_, i) => i + 1);
        }
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar_collapsed', isCollapsed);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const sidebar = document.querySelector('.sidebar');
            if (localStorage.getItem('sidebar_collapsed') === 'false') {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.add('collapsed');
            }
        });
    </script>
</body>

</html>