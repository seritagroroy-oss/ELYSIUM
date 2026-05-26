<?php
session_start();
include 'lang.php';
include 'db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}
$__perms = getUserPermissionsByEmail($_SESSION['user_id']);
$_SESSION['permissions'] = $__perms;
if (($_SESSION['user_role'] ?? '') !== 'admin' && empty($__perms['can_view_salaries'])) {
    header('Location: dashboard.php');
    exit;
}
$subscriptionState = getUserSubscriptionState($_SESSION['user_id']);
$current_period = $_GET['period'] ?? date('Y-m');
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo __('salaries_title'); ?> - Pointage Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/scrollbar.css">
    <link rel="stylesheet" href="assets/css/subscription-banner.css">
    <style>
        :root {
            --primary: #3b82f6;
            --bg-dark: #0f172a;
            --bg-sidebar: #1e293b;
            --bg-card: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --success: #22c55e;
            --danger: #ef4444;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-dark);
            color: var(--text-main);
            margin: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        .main-content {
            flex: 1;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: none;
            transition: 0.2s;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .header-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 1.5rem;
            border-radius: 16px;
        }

        .stat-card h3 {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
            margin: 0 0 0.5rem 0;
        }

        .stat-card .value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--primary);
        }

        .salary-table-container {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            overflow: hidden;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .table-scroll {
            overflow-y: auto;
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        th {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            font-weight: 600;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(59, 130, 246, 0.1);
            color: var(--primary);
        }

        .search-container {
            position: relative;
            width: 320px;
        }

        .search-container i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            transition: 0.3s;
        }

        .search-input {
            width: 100%;
            padding: 0.7rem 1rem 0.7rem 45px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: white;
            outline: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        }

        .search-input:focus {
            border-color: var(--primary);
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .search-input:focus+i {
            color: var(--primary);
        }

        .clickable-absence {
            cursor: pointer;
            transition: 0.2s;
            padding: 5px 10px;
            border-radius: 6px;
        }

        .clickable-absence:hover {
            background: rgba(239, 68, 68, 0.1);
            color: white !important;
        }

        /* Modal Details */
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
        }

        .modal-content {
            background: var(--bg-sidebar);
            border: 1px solid var(--border);
            padding: 2rem;
            border-radius: 20px;
            width: 90%;
            max-width: 400px;
        }

        .absence-list {
            margin: 1.5rem 0;
            max-height: 250px;
            overflow-y: auto;
        }

        .absence-item {
            padding: 10px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
        }



        @media print {
            @page {
                size: A4;
                margin: 10mm 15mm !important;
            }

            body {
                background: white !important;
                color: black !important;
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .btn,
            header,
            .header-summary,
            .search-container,
            #sync-indicator,
            .salary-table-container,
            .modal,
            ::-webkit-scrollbar {
                display: none !important;
            }

            .main-content {
                padding: 0 !important;
                display: block !important;
                overflow: visible !important;
            }

            .printable-slip {
                display: block !important;
            }
        }

        .printable-slip {
            display: none;
            padding: 5px;
            background: white;
            color: black;
            font-family: 'Outfit', sans-serif;
            width: 100%;
            box-sizing: border-box;
        }

        .slip-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .slip-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }

        .slip-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            color: black;
        }

        .slip-table th,
        .slip-table td {
            border: 1px solid #000;
            padding: 8px 12px;
            text-align: left;
            font-size: 0.9rem;
        }

        .slip-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8rem;
        }

        .row-total {
            font-weight: bold;
            background: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .company-info {
            text-align: left;
            font-size: 0.85rem;
            line-height: 1.4;
        }

        .slip-title {
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            border: 2px solid #000;
            background: #f8fafc;
            font-weight: bold;
            text-transform: uppercase;
        }
    </style>
</head>

<body>
    <main class="main-content">
        <header>
            <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                <a href="dashboard.php" class="btn"
                    style="background: var(--bg-sidebar); color: white; border: 1px solid var(--border); text-decoration: none;"><i
                        class="fas fa-times"></i> <?php echo __('close'); ?></a>
                <h2 style="margin: 0; white-space: nowrap;"><?php echo __('salaries_title'); ?></h2>
            </div>

            <div style="flex: 2; display: flex; justify-content: center; padding: 0 40px;">
                <div class="search-container" style="width: 100%; max-width: 450px;">
                    <input type="text" id="agent-search" oninput="filterResults()"
                        placeholder="<?php echo __('agent_search'); ?>" class="search-input">
                    <i class="fas fa-search"></i>
                </div>
            </div>

            <div style="display: flex; align-items: center; gap: 15px; flex: 1; justify-content: flex-end;">
                <div id="sync-indicator"
                    style="font-size: 0.8rem; color: var(--success); opacity:0; margin-right: 10px;">
                    <i class="fas fa-sync fa-spin"></i> <?php echo __('syncing'); ?>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <div
                        style="background: var(--bg-card); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 12px; display: flex; align-items: center; gap: 10px; white-space: nowrap;">
                        <span style="color: var(--text-muted); font-size: 0.9rem;"><?php echo __('period_label'); ?>
                            :</span>
                        <select id="period-select" onchange="updatePeriod()"
                            style="background: transparent; color: white; border: none; outline: none; cursor: pointer; font-weight: 600;">
                            <?php
                            for ($i = 0; $i < 6; $i++) {
                                $p = date('Y-m', strtotime("-$i months"));
                                $selected = ($p == $current_period) ? 'selected' : '';
                                echo "<option value='$p' $selected>$p</option>";
                            }
                            ?>
                        </select>
                    </div>
                    <div id="period-range-display"
                        style="font-size: 0.75rem; color: var(--primary); opacity: 0.8; font-weight: 500;">
                        Chargement des dates...
                    </div>
                </div>
                <button class="btn btn-primary" onclick="openPrintModal()"><i class="fas fa-print"></i>
                    <?php echo __('print'); ?></button>
            </div>
        </header>
        <div id="subscription-banner" class="subscription-banner" style="display:none;">
            <div class="txt" id="subscription-banner-text"></div>
            <a href="subscription.php" id="btn-go-premium" class="btn btn-primary"
                style="text-decoration:none; padding:0.4rem 0.7rem; font-size: 0.85rem;">Passer en Premium</a>
        </div>

        <div class="lock-target">
            <div class="header-summary">
                <div class="stat-card">
                    <h3><?php echo __('stat_agents_label'); ?></h3>
                    <div class="value" id="stat-agents">0</div>
                </div>
                <div class="stat-card">
                    <h3><?php echo __('stat_absences_label'); ?></h3>
                    <div class="value" id="stat-absences" style="color: var(--danger);">0</div>
                </div>
                <div class="stat-card">
                    <h3><?php echo __('stat_mass_label'); ?></h3>
                    <div class="value" id="stat-total" style="color: var(--success);">0 <small>FCFA</small></div>
                </div>
            </div>

            <div class="salary-table-container">
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th><?php echo __('table_agent'); ?></th>
                                <th><?php echo __('table_vacation'); ?></th>
                                <th><?php echo __('table_base'); ?></th>
                                <th style="text-align: center;"><?php echo __('table_absences'); ?></th>
                                <th style="text-align: center;"><?php echo __('table_deductions'); ?></th>
                                <th style="text-align: center;"><?php echo __('table_gains'); ?></th>
                                <th><?php echo __('table_total'); ?></th>
                            </tr>
                        </thead>
                        <tbody id="salary-body">
                            <!-- Loaded via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="modal-details" class="modal">
                <div class="modal-content">
                    <h3 id="modal-title" style="margin-top: 0;">Détails des Absences</h3>
                    <p id="modal-agent-name" style="color: var(--primary); font-weight: 600; margin-bottom: 20px;"></p>
                    <div class="absence-list" id="absence-list"></div>
                    <button class="btn" style="width: 100%; background: rgba(255,255,255,0.05); color:white;"
                        onclick="closeModal()">Fermer</button>
                </div>
            </div>

            <div id="modal-print" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <style>
                        .modal-form-group {
                            margin-bottom: 25px;
                        }

                        .modal-label {
                            display: block;
                            font-size: 0.85rem;
                            color: var(--text-muted);
                            margin-bottom: 10px;
                            font-weight: 500;
                        }

                        .modal-input {
                            width: 100%;
                            box-sizing: border-box;
                            background: #1e293b;
                            border: 1px solid var(--border);
                            color: white !important;
                            padding: 12px 15px;
                            border-radius: 10px;
                            outline: none;
                            font-family: inherit;
                            font-size: 0.95rem;
                            transition: all 0.2s;
                            appearance: none;
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                            background-repeat: no-repeat;
                            background-position: right 15px center;
                            background-size: 12px;
                        }

                        .modal-input option {
                            background: #1e293b;
                            color: white;
                        }

                        .modal-input:focus {
                            border-color: var(--primary);
                            background: #232f42;
                        }

                        .modal-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            column-gap: 25px;
                            row-gap: 0;
                        }
                    </style>

                    <div class="modal-form-group"
                        style="background: rgba(59, 130, 246, 0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2); margin-bottom: 20px;">
                        <label class="modal-label"
                            style="color: var(--primary); font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">1.
                            Sélection de l'Agent</label>
                        <select id="agent-print-select" class="modal-input"
                            onchange="updateDefaultMatricule()"></select>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label class="modal-label"
                            style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: var(--primary);">2.
                            Détails Administratifs</label>
                        <div class="modal-grid">
                            <div class="modal-form-group">
                                <label class="modal-label">Matricule</label>
                                <input type="text" id="print-matricule" class="modal-input" placeholder="Ex: AG-001">
                            </div>
                            <div class="modal-form-group">
                                <label class="modal-label">N° CNPS</label>
                                <input type="text" id="print-cnps" class="modal-input" value="00-00000000-0">
                            </div>
                        </div>

                        <div class="modal-grid">
                            <div class="modal-form-group">
                                <label class="modal-label">Ancienneté</label>
                                <input type="text" id="print-anciennete" class="modal-input" placeholder="Ex: 3 ans">
                            </div>
                            <div class="modal-form-group">
                                <label class="modal-label">Type de Contrat</label>
                                <select id="print-contrat" class="modal-input">
                                    <option value="CDI">CDI</option>
                                    <option value="CDD">CDD</option>
                                    <option value="PRESTATION">PRESTATION</option>
                                    <option value="STAGE">STAGE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style="padding-top: 15px; border-top: 1px solid var(--border);">
                        <label class="modal-label"
                            style="font-weight: 700; font-size: 0.75rem; text-transform: uppercase; color: var(--primary);">3.
                            Règlement</label>
                        <div class="modal-grid">
                            <div class="modal-form-group">
                                <label class="modal-label">Mode de Règlement</label>
                                <input type="text" id="print-paiement" class="modal-input" value="ESPÈCES">
                            </div>
                            <div></div> <!-- Empty space to prevent overflow/too much width -->
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="btn" style="flex:1; background: rgba(255,255,255,0.05); color:white;"
                            onclick="closePrintModal()">Annuler</button>
                        <button class="btn btn-primary" style="flex:1;" onclick="prepareAndPrint()">Générer &
                            Imprimer</button>
                    </div>
                </div>
            </div>

            <div id="print-area" class="printable-slip"></div>
        </div>
    </main>

    <script src="assets/js/subscription-banner.js"></script>
    <script>
        window.SUBSCRIPTION_STATE = <?php echo json_encode($subscriptionState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;

        let currentPeriod = '<?php echo $current_period; ?>';
        let allSalaryData = [];
        let appSettings = { cycle_start: 21, cycle_end: 20, loaded: false };

        async function loadSalaries() {
            if (!appSettings.loaded) {
                try {
                    const sres = await fetch('api.php?action=get_settings');
                    const sdata = await sres.json();
                    appSettings = { ...sdata, loaded: true };
                } catch (e) { console.error("Settings load failed", e); }
            }
            updateRangeDisplay();

            const indicator = document.getElementById('sync-indicator');
            indicator.style.opacity = 1;

            try {
                const res = await fetch(`api.php?action=get_salaries&period=${currentPeriod}`);
                const data = await res.json();
                allSalaryData = data;

                filterResults(); // Use filtering logic to render
                updateStats(data);
            } catch (e) {
                console.error("Erreur de chargement des salaires:", e);
            } finally {
                setTimeout(() => indicator.style.opacity = 0, 500);
            }
        }

        function filterResults() {
            const query = document.getElementById('agent-search').value.toLowerCase();
            const filtered = allSalaryData.filter(row =>
                row.name.toLowerCase().includes(query) ||
                row.site.toLowerCase().includes(query) ||
                row.subsite.toLowerCase().includes(query)
            );
            renderSalaries(filtered);
        }

        function renderSalaries(data) {
            const body = document.getElementById('salary-body');
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);">Aucune donnée disponible</td></tr>';
                return;
            }

            // Group by Site and Subsite
            const grouped = {};
            data.forEach(row => {
                if (!grouped[row.site]) grouped[row.site] = {};
                if (!grouped[row.site][row.subsite]) grouped[row.site][row.subsite] = [];
                grouped[row.site][row.subsite].push(row);
            });

            let html = '';
            let isFirstSite = true;
            for (const siteName in grouped) {
                if (!isFirstSite) {
                    html += `<tr style="height: 30px;"><td colspan="7" style="border:none; background:transparent;"></td></tr>`;
                }
                html += `<tr><td colspan="7" style="background: rgba(59, 130, 246, 0.1); color: var(--primary); font-weight: 700; padding: 0.75rem 1rem; border-left: 4px solid var(--primary);"><i class="fas fa-building" style="margin-right: 10px;"></i> ${siteName}</td></tr>`;
                isFirstSite = false;

                let isFirstSubsite = true;
                for (const subsiteName in grouped[siteName]) {
                    if (!isFirstSubsite) {
                        html += `<tr style="height: 15px;"><td colspan="7" style="border:none; background:transparent;"></td></tr>`;
                    }
                    html += `<tr><td colspan="7" style="background: rgba(255, 255, 255, 0.02); color: var(--text-muted); font-size: 0.8rem; font-weight: 600; padding: 0.5rem 1rem; text-transform: uppercase;"><i class="fas fa-layer-group" style="margin-right: 10px;"></i> ${subsiteName}</td></tr>`;
                    isFirstSubsite = false;

                    grouped[siteName][subsiteName].forEach((row, index) => {
                        const originalIndex = allSalaryData.indexOf(row);
                        html += `
                            <tr>
                               <td style="font-weight: 600; padding-left: 2rem;">${row.name}</td>
                                <td><span class="badge">${row.shift_type}</span></td>
                                <td>${row.base.toLocaleString()} <small>Frs</small></td>
                                <td style="text-align: center;">
                                   <span class="clickable-absence" style="color: var(--danger); font-weight: 700;" onclick="showAbsenceDetails(${originalIndex})">
                                       ${row.absences} <i class="fas fa-eye" style="font-size: 0.7rem; margin-left: 5px; opacity: 0.5;"></i>
                                    </span>
                                </td>
                               <td style="text-align: center; color: var(--danger); font-weight: 700;">- ${row.deductions.toLocaleString()} <small>Frs</small></td>
                               <td style="text-align: center; color: var(--primary); font-weight: 700;">+ ${row.gains.toLocaleString()} <small>Frs</small></td>
                               <td style="font-weight: 700; color: var(--success); font-size: 1.1rem;">${row.total.toLocaleString()} <small>FCFA</small></td>
                            </tr>
                        `;
                    });
                }
            }
            body.innerHTML = html;
        }

        function showAbsenceDetails(index) {
            const agent = allSalaryData[index];
            if (!agent || agent.absences === 0) return;

            document.getElementById('modal-agent-name').textContent = agent.name;
            const list = document.getElementById('absence-list');
            list.innerHTML = agent.absence_details.map(d => `
                <div class="absence-item">
                    <span>${formatDateFr(d.date)}</span>
                   <span class="badge" style="background: ${d.shift === 'Nuit' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(234, 179, 8, 0.1)'}; color: ${d.shift === 'Nuit' ? '#a855f7' : '#eab308'};">
                       ${d.shift}
                    </span>
                </div>
            `).join('');

            document.getElementById('modal-details').style.display = 'flex';
        }

        function formatDateFr(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        }

        function closeModal() {
            document.getElementById('modal-details').style.display = 'none';
        }

        function updateStats(data) {
            const total = data.reduce((sum, row) => sum + row.total, 0);
            const absences = data.reduce((sum, row) => sum + row.absences, 0);
            document.getElementById('stat-agents').textContent = data.length;
            document.getElementById('stat-absences').textContent = absences;
            document.getElementById('stat-total').innerHTML = `${total.toLocaleString()} <small>FCFA</small>`;
        }

        function updatePeriod() {
            currentPeriod = document.getElementById('period-select').value;
            loadSalaries();
        }

        function updateRangeDisplay() {
            if (!appSettings.loaded) return;

            const startDay = parseInt(appSettings.cycle_start);
            const endDay = parseInt(appSettings.cycle_end);

            const year = parseInt(currentPeriod.split('-')[0]);
            const month = parseInt(currentPeriod.split('-')[1]);

            // Logic matches api.php: Cycle starts at startDay of current month
            const start = new Date(year, month - 1, startDay);
            const end = new Date(year, month, endDay);

            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            const startStr = start.toLocaleDateString('fr-FR', options);
            const endStr = end.toLocaleDateString('fr-FR', options);

            document.getElementById('period-range-display').textContent = `Cycle du ${startStr} au ${endStr}`;
        }

        // Initial load
        initSubscriptionBanner({
            lockSelector: '.lock-target',
            trialTextPrefix: 'Mode gratuit (Essai 15 jours) : il vous reste ',
            trialTextSuffix: ' jour(s) avant expiration.'
        });
        if ((window.SUBSCRIPTION_STATE || {}).access_allowed) {
            loadSalaries();
        }

        // Auto-refresh every 10 seconds to keep synced with attendance changes
        function openPrintModal() {
            const select = document.getElementById('agent-print-select');
            select.innerHTML = allSalaryData.map((row, index) =>
                `<option value="${index}">${row.name} (${row.site})</option>`
            ).join('');
            updateDefaultMatricule();
            document.getElementById('modal-print').style.display = 'flex';
        }

        function updateDefaultMatricule() {
            const index = document.getElementById('agent-print-select').value;
            if (allSalaryData[index]) {
                const name = allSalaryData[index].name;
                document.getElementById('print-matricule').value = `AG-${name.substring(0, 3).toUpperCase()}-${index}`;
            }
        }

        function closePrintModal() {
            document.getElementById('modal-print').style.display = 'none';
        }

        function prepareAndPrint() {
            const index = document.getElementById('agent-print-select').value;
            const agent = allSalaryData[index];
            const printArea = document.getElementById('print-area');

            const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
            const periodYear = currentPeriod.split('-')[0];
            const periodMonth = monthNames[parseInt(currentPeriod.split('-')[1]) - 1];

            let html = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="company-info">
                        <h2 style="margin:0; color:#3b82f6;">POINTAGE PRO SERVICES</h2>
                        <p>Services de Sécurité & Gardiennage<br>
                        Abidjan, Côte d'Ivoire<br>
                        Tel: +225 00 00 00 00 00<br>
                        RCCM: CI-ABJ-00-0000-B-00<br>
                        N° Compte Contribuable: 0000000 X</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="border: 1px solid #000; padding: 10px; min-width: 200px; text-align: center;">
                            <strong style="text-transform: uppercase;">Bulletin de Paie</strong><br>
                           <span>Période: ${periodMonth} ${periodYear}</span>
                        </div>
                    </div>
                </div>

                <div class="slip-title">DÉCOMPTE DE RÉMUNÉRATION</div>
                
                <div class="slip-grid" style="margin-bottom: 20px; border: 1px solid #000; padding: 15px; grid-template-columns: 1.5fr 1fr; gap: 20px;">
                    <div style="border-right: 1px solid #eee; padding-right: 20px;">
                       <p style="margin:5px 0;"><strong>MATRICULE :</strong> ${document.getElementById('print-matricule').value || '-'}</p>
                       <p style="margin:5px 0;"><strong>NOM & PRÉNOM :</strong> ${agent.name}</p>
                       <p style="margin:5px 0;"><strong>EMPLOI :</strong> ${agent.function_label || agent.function}</p>
                       <p style="margin:5px 0;"><strong>SITE :</strong> ${agent.site} (${agent.subsite})</p>
                    </div>
                    <div>
                       <p style="margin:5px 0;"><strong>N° CNPS :</strong> ${document.getElementById('print-cnps').value || '-'}</p>
                       <p style="margin:5px 0;"><strong>ANCIENNETÉ :</strong> ${document.getElementById('print-anciennete').value || '-'}</p>
                       <p style="margin:5px 0;"><strong>TYPE CONTRAT :</strong> ${document.getElementById('print-contrat').value}</p>
                       <p style="margin:5px 0;"><strong>MÉTHODE PAIEMENT :</strong> ${document.getElementById('print-paiement').value || '-'}</p>
                    </div>
                </div>

                <table class="slip-table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">Désignation</th>
                            <th style="width: 15%;" class="text-right">Nombre / Base</th>
                            <th style="width: 15%;" class="text-right">Taux</th>
                            <th style="width: 15%;" class="text-right">Gains</th>
                            <th style="width: 15%;" class="text-right">Retenues</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Salaire de Base Mensuel</td>
                            <td class="text-right">30 Jours</td>
                            <td class="text-right">${(agent.base / 30).toLocaleString()}</td>
                            <td class="text-right">${agent.base.toLocaleString()}</td>
                            <td class="text-right"></td>
                        </tr>
                        <tr>
                            <td>Absences non justifiées</td>
                            <td class="text-right">${agent.absences} Vacation(s)</td>
                            <td class="text-right">${(agent.base / 30).toLocaleString()}</td>
                            <td class="text-right"></td>
                            <td class="text-right">${agent.deductions.toLocaleString()}</td>
                        </tr>
                        <tr style="height: 100px;">
                            <td colspan="5"></td>
                        </tr>
                        <tr class="row-total">
                            <td colspan="3">TOTAUX</td>
                            <td class="text-right">${agent.base.toLocaleString()}</td>
                            <td class="text-right">${agent.deductions.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                    <table style="width: 300px; border-collapse: collapse; border: 2px solid #000;">
                        <tr style="background: #3b82f6; color: white;">
                            <td style="padding: 10px; font-weight: bold;">NET À PAYER (CFA)</td>
                           <td style="padding: 10px; font-weight: bold; text-align: right; font-size: 1.2rem;">${agent.total.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 30px;">
                   <p style="font-size: 0.8rem; font-style: italic;">Arrêté la présente somme à la valeur de : <strong style="text-transform: uppercase;">${numberToFrench(agent.total)} francs CFA</strong></p>
                </div>

                <h4 style="margin-top: 40px; border-bottom: 1px solid #000; padding-bottom: 5px;">DÉTAIL DES ABSENCES PÉRIODE</h4>
                <div style="font-size: 0.8rem; color: #444;">
                   ${agent.absences > 0 ?
                    agent.absence_details.map(d => `${formatDateFr(d.date)} (${d.shift})`).join(' | ') :
                    'Aucune absence à signaler.'}
                </div>

                <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 250px;">
                        <p style="font-weight: bold; margin-bottom: 70px;">L'Employeur</p>
                        <p style="font-size: 0.7rem;">(Cachet et Signature)</p>
                    </div>
                    <div style="text-align: center; width: 250px;">
                        <p style="font-weight: bold; margin-bottom: 70px;">L'Employé</p>
                        <p style="font-size: 0.7rem;">(Nom et Signature)</p>
                    </div>
                </div>
            `;

            printArea.innerHTML = html;
            closePrintModal();
            setTimeout(() => {
                window.print();
            }, 300);
        }

        // Helper function for numbers to words (Simple version)
        function numberToFrench(n) {
            // Very basic implementation for the demo, can be expanded
            if (n === 0) return "zéro";
            return n.toLocaleString('fr-FR') + " (en chiffres)";
        }

        setInterval(loadSalaries, 10000);
    </script>
</body>

</html>