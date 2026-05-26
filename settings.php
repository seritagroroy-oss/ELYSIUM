<?php
session_start();
include 'lang.php';
include 'db.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

// Force super_admin for admin@gmail.com
if ($_SESSION['user_id'] === 'admin@gmail.com' && ($_SESSION['user_role'] ?? '') !== 'super_admin') {
    $_SESSION['user_role'] = 'super_admin';
    $_SESSION['role_display_name'] = 'Directeur Général';
}

$currentPermissions = getUserPermissionsByEmail($_SESSION['user_id']);
$_SESSION['permissions'] = $currentPermissions;
if (($_SESSION['user_role'] ?? '') !== 'admin' && empty($currentPermissions['can_view_settings'])) {
    header('Location: dashboard.php');
    exit;
}
$subscriptionState = getUserSubscriptionState($_SESSION['user_id']);

$section = $_GET['section'] ?? 'cycle';
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>
        <?php echo __('settings'); ?> - Pointage Pro
    </title>
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
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-dark);
            color: var(--text-main);
            margin: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .settings-container {
            display: flex;
            width: 100%;
            height: 100%;
        }

        .settings-sidebar {
            width: 300px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: fixed;
            height: 100vh;
            z-index: 1000;
            left: 0;
            top: 0;
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
        }

        .settings-sidebar.collapsed {
            left: -340px;
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

        .settings-sidebar:not(.collapsed) ~ .sidebar-overlay {
            opacity: 1;
            pointer-events: all;
        }

        .settings-content {
            flex: 1;
            padding: 3rem;
            overflow-y: auto;
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);
            width: 100%;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 1rem;
            border-radius: 12px;
            color: var(--text-muted);
            text-decoration: none;
            transition: all 0.3s;
            font-weight: 500;
        }

        .nav-link:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-main);
        }

        .nav-link.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .nav-link i {
            font-size: 1.2rem;
        }

        .back-btn {
            margin-bottom: 2rem;
            color: var(--text-muted);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            transition: 0.2s;
        }

        .back-btn:hover {
            color: var(--primary);
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--text-muted);
            margin-bottom: 3rem;
        }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 2rem;
            border-radius: 20px;
            max-width: 600px;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        input[type="number"] {
            width: 100%;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: white;
            font-size: 1rem;
            outline: none;
        }

        input:focus {
            border-color: var(--primary);
        }

        .btn {
            padding: 1rem 2rem;
            border-radius: 12px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }

        /* Lang styles from dashboard */
        .lang-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .lang-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 1.5rem;
            border-radius: 16px;
            cursor: pointer;
            text-align: center;
            transition: 0.3s;
        }

        .lang-card:hover {
            border-color: var(--primary);
            background: rgba(59, 130, 246, 0.05);
        }

        .lang-card.active {
            background: rgba(59, 130, 246, 0.15);
            border-color: var(--primary);
            color: var(--primary);
        }

        .lang-card .flag {
            font-size: 2rem;
            display: block;
            margin-bottom: 10px;
        }

        .lang-card .name {
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="settings-container">
        <aside class="settings-sidebar collapsed">
            <a href="dashboard.php" class="back-btn">
                <i class="fas fa-arrow-left"></i>
                <span>
                    <?php echo __('back_dashboard'); ?>
                </span>
            </a>

            <div
                style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; padding-left: 1rem;">
                Configuration
            </div>

            <a href="?section=cycle" class="nav-link <?php echo $section == 'cycle' ? 'active' : ''; ?>">
                <i class="fas fa-calendar-alt"></i>
                <span>
                    <?php echo __('cycle_start_label'); ?> /
                    <?php echo __('cycle_end_label'); ?>
                </span>
            </a>

            <a href="?section=lang" class="nav-link <?php echo $section == 'lang' ? 'active' : ''; ?>">
                <i class="fas fa-globe"></i>
                <span>
                    <?php echo __('lang_choice'); ?>
                </span>
            </a>

            <a href="?section=salaries" class="nav-link <?php echo $section == 'salaries' ? 'active' : ''; ?>">
                <i class="fas fa-money-bill-wave"></i>
                <span>
                    <?php echo __('manage_salaries_settings'); ?>
                </span>
            </a>

            <a href="?section=functions" class="nav-link <?php echo $section == 'functions' ? 'active' : ''; ?>">
                <i class="fas fa-user-tag"></i>
                <span>
                    <?php echo __('manage_functions_settings'); ?>
                </span>
            </a>

            <?php if (($_SESSION['user_role'] ?? '') === 'admin' || ($_SESSION['user_role'] ?? '') === 'super_admin'): ?>
                <a href="?section=services" class="nav-link <?php echo $section == 'services' ? 'active' : ''; ?>">
                    <i class="fas fa-users-gear"></i>
                    <span>Gestion des Services</span>
                </a>
                <a href="?section=payments" class="nav-link <?php echo $section == 'payments' ? 'active' : ''; ?>">
                    <i class="fas fa-receipt"></i>
                    <span>Historique Paiements</span>
                </a>
            <?php endif; ?>
        </aside>
        <div class="sidebar-overlay" onclick="toggleSettingsSidebar()"></div>

        <main class="settings-content">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 2rem;">
                <button class="btn" onclick="toggleSettingsSidebar()" style="background: rgba(255,255,255,0.05); color: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); margin-right: 10px;"><i class="fas fa-bars"></i></button>
                <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">Paramètres Système</span>
            </div>
            <div id="subscription-banner" class="subscription-banner" style="display:none;">
                <div class="txt" id="subscription-banner-text"></div>
                <a href="subscription.php" id="btn-go-premium" class="btn btn-primary"
                    style="text-decoration:none; padding:0.4rem 0.7rem; font-size: 0.85rem;">Passer en Premium</a>
            </div>
            <div class="lock-target">
                <?php if ($section == 'cycle'): ?>
                    <h1>
                        <?php echo __('settings_modal_title'); ?>
                    </h1>
                    <p class="subtitle">
                        <?php echo __('cycle_settings_subtitle'); ?>
                    </p>

                    <div class="card">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 2rem;">
                            <div class="form-group">
                                <label>
                                    <?php echo __('cycle_start_label'); ?>
                                </label>
                                <input type="number" id="cycle_start" min="1" max="28" value="21">
                            </div>
                            <div class="form-group">
                                <label>
                                    <?php echo __('cycle_end_label'); ?>
                                </label>
                                <input type="number" id="cycle_end" min="1" max="28" value="20">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="saveCycle()">
                            <?php echo __('save_btn'); ?>
                        </button>
                    </div>

                <?php elseif ($section == 'lang'): ?>
                    <h1>
                        <?php echo __('lang_choice'); ?>
                    </h1>
                    <p class="subtitle">Sélectionnez la langue de l'interface utilisateur.</p>

                    <div class="lang-grid" style="max-width: 600px;">
                        <?php
                        $langs = [
                            'fr' => ['flag' => '🇫🇷', 'name' => 'Français'],
                            'en' => ['flag' => '🇺🇸', 'name' => 'English'],
                            'es' => ['flag' => '🇪🇸', 'name' => 'Español'],
                            'de' => ['flag' => '🇩🇪', 'name' => 'Deutsch'],
                            'it' => ['flag' => '🇮🇹', 'name' => 'Italiano'],
                            'pt' => ['flag' => '🇵🇹', 'name' => 'Português']
                        ];
                        foreach ($langs as $code => $info): ?>
                            <div class="lang-card <?php echo $lang == $code ? 'active' : ''; ?>"
                                onclick="changeLang('<?php echo $code; ?>')">
                                <span class="flag">
                                    <?php echo $info['flag']; ?>
                                </span>
                                <span class="name">
                                    <?php echo $info['name']; ?>
                                </span>
                            </div>
                        <?php endforeach; ?>
                    </div>

                <?php elseif ($section == 'salaries'): ?>
                    <h1>
                        <?php echo __('manage_salaries_settings'); ?>
                    </h1>
                    <p class="subtitle">
                        <?php echo __('salary_settings_subtitle'); ?>
                    </p>

                    <div id="function-salary-list" style="max-width: 900px;">
                        <!-- Loaded via JS -->
                    </div>

                <?php elseif ($section == 'functions'): ?>
                    <h1>
                        <?php echo __('manage_functions_settings'); ?>
                    </h1>
                    <p class="subtitle">
                        <?php echo __('function_settings_subtitle'); ?>
                    </p>

                    <div class="card" style="max-width: 800px; padding: 2rem; border-radius: 20px;">
                        <div id="functions-list-container">
                            <!-- Loaded via JS -->
                        </div>

                        <button onclick="addFunctionRow()" class="btn btn-primary"
                            style="margin-top: 1.5rem; background: rgba(59, 130, 246, 0.1); color: var(--primary); border: 2px dashed rgba(59, 130, 246, 0.3); width: 100%; padding: 1rem; font-weight: 700;">
                            <i class="fas fa-plus" style="margin-right: 10px;"></i>
                            <?php echo __('add_function'); ?>
                        </button>

                        <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                            <button onclick="saveFunctions()" class="btn btn-primary"
                                style="padding: 1rem 3rem; font-weight: 700;">
                                <?php echo __('save_btn'); ?>
                            </button>
                        </div>
                    </div>

                <?php elseif ($section == 'services' && (($_SESSION['user_role'] ?? '') === 'admin' || ($_SESSION['user_role'] ?? '') === 'super_admin')): ?>
                    <h1>Gestion des Services</h1>
                    <p class="subtitle">Créer des comptes par Gmail et définir les droits de visualisation/modification.
                    </p>

                    <div class="card" style="max-width: 1000px; margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Créer un Service + Compte</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 1rem;">
                            <input type="text" id="svc-name" placeholder="Nom du service (ex: RH)"
                                style="padding: 0.9rem; background: rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; color:white;">
                            <input type="text" id="svc-user-name" placeholder="Nom complet"
                                style="padding: 0.9rem; background: rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; color:white;">
                            <input type="email" id="svc-email" placeholder="gmail du compte"
                                style="padding: 0.9rem; background: rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; color:white;">
                            <?php if (($_SESSION['user_role'] ?? '') === 'super_admin'): ?>
                                <input type="text" id="svc-role-display-name" placeholder="Titre du rôle (ex: Directeur RH)"
                                    style="padding: 0.9rem; background: rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; color:white;">
                                <select id="svc-role" style="padding: 0.9rem; background: var(--bg-sidebar); border:1px solid var(--border); border-radius:10px; color:white;">
                                    <option value="user">Manager / Admin de Service</option>
                                    <option value="super_admin">Super Administrateur Global</option>
                                </select>
                            <?php endif; ?>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin: -0.2rem 0 0.8rem;">
                            Un mot de passe temporaire est genere automatiquement a la creation du compte.
                        </div>
                        <div style="display:flex; flex-wrap: wrap; gap: 14px; margin: 1rem 0 1.2rem;">
                            <label><input type="checkbox" id="perm-view-dashboard" checked> Voir Pointage</label>
                            <label><input type="checkbox" id="perm-edit-dashboard" checked> Modifier Pointage</label>
                            <label><input type="checkbox" id="perm-view-archives" checked> Voir Archives</label>
                            <label><input type="checkbox" id="perm-view-salaries" checked> Voir Salaires</label>
                            <label><input type="checkbox" id="perm-view-settings"> Voir Paramètres</label>
                        </div>
                        <button id="btn-create-service-account" type="button" class="btn btn-primary">Créer le
                            compte</button>
                        <div id="svc-create-status"
                            style="margin-top:0.75rem; font-size:0.95rem; color: var(--text-muted);"></div>
                    </div>

                    <div class="card" style="max-width: 1200px;">
                        <h3 style="margin-bottom: 1rem;">Services et Permissions</h3>
                        <div id="services-admin-list">Chargement...</div>
                    </div>

                <?php elseif ($section == 'payments' && (($_SESSION['user_role'] ?? '') === 'admin' || ($_SESSION['user_role'] ?? '') === 'super_admin')): ?>
                    <h1>Historique des Paiements</h1>
                    <p class="subtitle">Suivi des transactions Stripe, Orange Money et Wave.</p>

                    <div class="card" style="max-width: 1200px;">
                        <div id="payments-history-list">Chargement...</div>
                    </div>

                <?php endif; ?>
            </div>
        </main>
    </div>

    <script src="assets/js/subscription-banner.js"></script>
    <script>
        window.SUBSCRIPTION_STATE = <?php echo json_encode($subscriptionState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;

        async function saveCycle() {
            const start = document.getElementById('cycle_start').value;
            const end = document.getElementById('cycle_end').value;

            const res = await fetch('api.php?action=save_settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cycle_start: start, cycle_end: end })
            });

            const data = await res.json();
            if (data.success) {
                alert('Success!');
            } else {
                alert('Error: ' + data.message);
            }
        }

        async function changeLang(langCode) {
            await fetch('api.php?action=set_lang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lang: langCode })
            });
            window.location.reload();
        }

        let salaryConfig = {};
        let systemFunctions = [];

        async function loadSettingsData() {
            // Load Functions first
            const fRes = await fetch('api.php?action=get_functions');
            systemFunctions = await fRes.json();

            if ("<?php echo $section; ?>" === "salaries") {
                const sRes = await fetch('api.php?action=get_salary_config');
                salaryConfig = await sRes.json();
                renderSalaryFunctions();
            } else if ("<?php echo $section; ?>" === "functions") {
                renderFunctionsManager();
            }
        }

        function renderSalaryFunctions() {
            const list = document.getElementById('function-salary-list');
            if (!list) return;

            list.innerHTML = systemFunctions.map(f => {
                const base = salaryConfig[f.id] || 75000;
                const daily = Math.round(base / 30);

                return `
                <div class="card" style="max-width: 100%; margin-bottom: 2.5rem; border-radius: 24px; padding: 2.5rem; display: grid; grid-template-columns: 1fr 220px 220px; gap: 100px; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 10px 40px rgba(0,0,0,0.25);">
                    <div style="border-right: 2px solid rgba(59, 130, 246, 0.1); padding-right: 20px;">
                       <div style="font-weight: 800; font-size: 1.4rem; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px;">${f.name}</div>
                       <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; font-weight: 600; opacity: 0.6;">Code: ${f.id}</div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="display: block; font-size: 0.7rem; margin-bottom: 15px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; text-align: center;"><?php echo __('base_salary'); ?></label>
                        <div style="position: relative; height: 60px;">
                            <input type="number" value="${base}" 
                                   placeholder="0"
                                   style="width: 100%; height: 100%; padding: 0 60px 0 20px; border-radius: 14px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.1); color: #fff; font-size: 1.25rem; font-weight: 800; outline: none; transition: all 0.3s ease; text-align: center;"
                                   onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 0 20px rgba(59, 130, 246, 0.15)';"
                                   onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none';"
                                  onchange="updateFunctionSalary('${f.id}', this.value)">
                            <span style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--primary); font-size: 0.8rem; font-weight: 900; pointer-events: none;">FCFA</span>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="display: block; font-size: 0.7rem; margin-bottom: 15px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; text-align: center;"><?php echo __('daily_salary'); ?></label>
                        <div style="height: 60px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.07); border: 2px solid rgba(59, 130, 246, 0.25); border-radius: 14px; font-size: 1.4rem; color: var(--primary); font-weight: 900; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                           ${daily.toLocaleString()} <small style="font-size: 0.65rem; margin-left: 5px; opacity: 0.7;">/ J</small>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        }

        async function updateFunctionSalary(funcId, salary) {
            salaryConfig[funcId] = parseInt(salary);
            await fetch('api.php?action=update_salary_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: salaryConfig })
            });
            renderSalaryFunctions();
        }

        function renderFunctionsManager() {
            const container = document.getElementById('functions-list-container');
            if (!container) return;

            if (systemFunctions.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 3rem; opacity: 0.5;">Aucune fonction définie.</div>';
                return;
            }

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 40px; margin-bottom: 1.5rem; padding: 0 1.5rem; color: var(--text-muted); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7;">
                    <div>Code</div>
                    <div>Nom de la Fonction</div>
                    <div></div>
                </div>
               ${systemFunctions.map((f, index) => `
                    <div class="function-row" style="display: grid; grid-template-columns: 140px 1fr 50px; gap: 40px; margin-bottom: 1.2rem; align-items: center; background: rgba(255,255,255,0.01); padding: 1rem 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.04); transition: 0.3s hover;">
                        <div>
                           <input type="text" class="func-id" value="${f.id}" placeholder="Ex: AS" 
                                   style="width: 100%; padding: 0.9rem; border-radius: 12px; background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.08); color: var(--primary); font-weight: 800; text-align: center; outline: none; transition: 0.2s;"
                                   onfocus="this.style.borderColor='var(--primary)'; this.style.background='rgba(0,0,0,0.6)';"
                                   onblur="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.background='rgba(0,0,0,0.5)';">
                        </div>
                        <div>
                           <input type="text" class="func-name" value="${f.name}" placeholder="Ex: Agent Simple" 
                                   style="width: 100%; padding: 0.9rem; border-radius: 12px; background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.08); color: #fff; outline: none; transition: 0.2s; font-weight: 500;"
                                   onfocus="this.style.borderColor='var(--primary)'; this.style.background='rgba(0,0,0,0.6)';"
                                   onblur="this.style.borderColor='rgba(255,255,255,0.08)'; this.style.background='rgba(0,0,0,0.5)';">
                        </div>
                        <button onclick="removeFunctionRow(this)" 
                                style="background: rgba(239, 68, 68, 0.08); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;" 
                                onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.transform='scale(1.05)'" 
                                onmouseout="this.style.background='rgba(239, 68, 68, 0.08)'; this.style.transform='scale(1)'">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                `).join('')}
            `;
        }

        function addFunctionRow() {
            const container = document.getElementById('functions-list-container');
            const row = document.createElement('div');
            row.className = 'function-row';
            row.style = "display: grid; grid-template-columns: 140px 1fr 50px; gap: 40px; margin-bottom: 1.2rem; align-items: center; background: rgba(255,255,255,0.01); padding: 1rem 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.04);";
            row.innerHTML = `
                <div>
                    <input type="text" class="func-id" value="" placeholder="Ex: AS" 
                           style="width: 100%; padding: 0.9rem; border-radius: 12px; background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.08); color: var(--primary); font-weight: 800; text-align: center; outline: none; transition: 0.2s;"
                           onfocus="this.style.borderColor='var(--primary)';"
                           onblur="this.style.borderColor='rgba(255,255,255,0.08)';">
                </div>
                <div>
                    <input type="text" class="func-name" value="" placeholder="Nom de la fonction" 
                           style="width: 100%; padding: 0.9rem; border-radius: 12px; background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.08); color: #fff; outline: none; transition: 0.2s;"
                           onfocus="this.style.borderColor='var(--primary)';"
                           onblur="this.style.borderColor='rgba(255,255,255,0.08)';">
                </div>
                <button onclick="removeFunctionRow(this)" 
                        style="background: rgba(239, 68, 68, 0.08); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-trash-can"></i>
                </button>
            `;
            container.appendChild(row);
        }

        function removeFunctionRow(btn) {
            btn.parentElement.remove();
        }

        async function saveFunctions() {
            const rows = document.querySelectorAll('.function-row');
            const functions = [];
            rows.forEach(row => {
                const id = row.querySelector('.func-id').value.trim();
                const name = row.querySelector('.func-name').value.trim();
                if (id && name) {
                    functions.push({ id, name });
                }
            });

            const res = await fetch('api.php?action=save_functions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ functions })
            });

            const data = await res.json();
            if (data.success) {
                alert('Success!');
                window.location.reload();
            }
        }

        function getServicePermissionsFromForm(prefix = '') {
            return {
                can_view_dashboard: document.getElementById(`${prefix}perm-view-dashboard`)?.checked ?? false,
                can_edit_dashboard: document.getElementById(`${prefix}perm-edit-dashboard`)?.checked ?? false,
                can_view_archives: document.getElementById(`${prefix}perm-view-archives`)?.checked ?? false,
                can_view_salaries: document.getElementById(`${prefix}perm-view-salaries`)?.checked ?? false,
                can_view_settings: document.getElementById(`${prefix}perm-view-settings`)?.checked ?? false
            };
        }

        function setCreateServiceStatus(message, isError = false) {
            const el = document.getElementById('svc-create-status');
            if (!el) return;
            el.textContent = message || '';
            el.style.color = isError ? '#ef4444' : 'var(--text-muted)';
        }

        async function createServiceAccount() {
            const btn = document.getElementById('btn-create-service-account');
            try {
                const service_name = document.getElementById('svc-name').value.trim();
                const name = document.getElementById('svc-user-name').value.trim();
                const email = document.getElementById('svc-email').value.trim();
                const role_display_name = document.getElementById('svc-role-display-name') ? document.getElementById('svc-role-display-name').value.trim() : '';
                const role = document.getElementById('svc-role') ? document.getElementById('svc-role').value : 'user';
                const permissions = getServicePermissionsFromForm();

                if (!service_name || !name || !email) {
                    setCreateServiceStatus('Veuillez remplir tous les champs.', true);
                    return;
                }
                if (btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.7';
                    btn.textContent = 'Création...';
                }
                setCreateServiceStatus('Création du compte en cours...');

                const res = await fetch('api.php?action=create_service_account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service_name, name, email, role_display_name, role, permissions })
                });

                const raw = await res.text();
                let data = null;
                try {
                    data = JSON.parse(raw);
                } catch (e) {
                    throw new Error('Réponse serveur invalide: ' + raw.substring(0, 180));
                }

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Erreur lors de la création.');
                }

                document.getElementById('svc-user-name').value = '';
                document.getElementById('svc-email').value = '';
                await loadServicesAdmin();
                const tempPwd = data.temp_password || '';
                const msg = tempPwd
                    ? ('Compte créé. Mot de passe temporaire: ' + tempPwd)
                    : 'Compte créé avec succès.';
                setCreateServiceStatus(msg);
            } catch (err) {
                console.error('createServiceAccount error:', err);
                setCreateServiceStatus('Création impossible: ' + (err.message || err), true);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = 'CrÃ©er le compte';
                }
            }
        }

        async function updateServicePermissions(serviceId) {
            const permissions = getServicePermissionsFromForm(`svc-${serviceId}-`);
            const res = await fetch('api.php?action=update_service_permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_id: serviceId, permissions })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Erreur de mise à jour');
                return;
            }
            alert('Permissions mises à jour.');
        }

        async function deleteServiceAccount(email) {
            if (!confirm(`Supprimer le compte ${email} `)) return;
            const res = await fetch('api.php?action=delete_service_account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Suppression impossible');
                return;
            }
            await loadServicesAdmin();
        }

        async function loadServicesAdmin() {
            const container = document.getElementById('services-admin-list');
            if (!container) return;

            const res = await fetch('api.php?action=get_services_management');
            const data = await res.json();
            if (!data.success) {
                container.innerHTML = `<div style="color:#ef4444;">${data.message || 'Erreur de chargement'}</div>`;
                return;
            }

            const services = data.services || [];
            if (services.length === 0) {
                container.innerHTML = '<div style="opacity:0.7;">Aucun service défini.</div>';
                return;
            }

            container.innerHTML = services.map(svc => {
                const p = svc.permissions || {};
                const users = svc.users || [];
                return `
                    <div style="border:1px solid var(--border); border-radius:14px; padding:1rem; margin-bottom:1rem; background:rgba(255,255,255,0.02);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                           <div style="font-weight:700;">${svc.name}</div>
                           <button class="btn" style="padding:0.55rem 0.9rem; background:var(--primary); color:white;" onclick="updateServicePermissions('${svc.id}')">Enregistrer droits</button>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:0.8rem;">
                           <label><input id="svc-${svc.id}-perm-view-dashboard" type="checkbox" ${p.can_view_dashboard ? 'checked' : ''}> Voir Pointage</label>
                           <label><input id="svc-${svc.id}-perm-edit-dashboard" type="checkbox" ${p.can_edit_dashboard ? 'checked' : ''}> Modifier Pointage</label>
                           <label><input id="svc-${svc.id}-perm-view-archives" type="checkbox" ${p.can_view_archives ? 'checked' : ''}> Voir Archives</label>
                           <label><input id="svc-${svc.id}-perm-view-salaries" type="checkbox" ${p.can_view_salaries ? 'checked' : ''}> Voir Salaires</label>
                           <label><input id="svc-${svc.id}-perm-view-settings" type="checkbox" ${p.can_view_settings ? 'checked' : ''}> Voir Paramètres</label>
                        </div>
                        <div style="font-size:0.9rem; color:var(--text-muted);">Comptes liés:</div>
                        <div style="margin-top:0.35rem;">
                           ${users.length === 0 ? '<span style="opacity:0.65;">Aucun compte</span>' : users.map(u => `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0;">
                                    <span>${u.name} - ${u.email}</span>
                                   <button class="btn" style="padding:0.35rem 0.6rem; background:rgba(239,68,68,0.15); color:#ef4444;" onclick="deleteServiceAccount('${u.email}')">Supprimer</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function formatMoney(amount, currency) {
            const val = Number(amount || 0).toLocaleString();
            return `${val} ${currency || ''}`.trim();
        }

        async function loadPaymentsHistory() {
            const container = document.getElementById('payments-history-list');
            if (!container) return;
            container.innerHTML = 'Chargement...';
            try {
                const res = await fetch('api.php?action=get_payments_history');
                const data = await res.json();
                if (!data.success) {
                    container.innerHTML = `<div style="color:#ef4444;">${data.message || 'Erreur de chargement'}</div>`;
                    return;
                }

                const rows = data.payments || [];
                if (!rows.length) {
                    container.innerHTML = '<div style="opacity:0.7;">Aucun paiement enregistre.</div>';
                    return;
                }

                container.innerHTML = `
                    <div style="overflow:auto;">
                        <table style="width:100%; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align:left; border-bottom:1px solid var(--border); color: var(--text-muted); font-size:0.85rem;">
                                    <th style="padding:10px;">Date</th>
                                    <th style="padding:10px;">Utilisateur</th>
                                    <th style="padding:10px;">Service</th>
                                    <th style="padding:10px;">Provider</th>
                                    <th style="padding:10px;">Reference</th>
                                    <th style="padding:10px;">Mois</th>
                                    <th style="padding:10px;">Montant</th>
                                    <th style="padding:10px;">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(r => `
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                                        <td style="padding:10px; white-space:nowrap;">${r.created_at || '-'}</td>
                                        <td style="padding:10px;">
                                            <div>${r.user_name || '-'}</div>
                                            <div style="font-size:0.8rem; color: var(--text-muted);">${r.email || '-'}</div>
                                        </td>
                                        <td style="padding:10px;">${r.service || '-'}</td>
                                        <td style="padding:10px;">${r.provider || '-'}</td>
                                        <td style="padding:10px; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.external_id || ''}">${r.external_id || '-'}</td>
                                        <td style="padding:10px;">${r.months || 1}</td>
                                        <td style="padding:10px;">${formatMoney(r.amount, r.currency)}</td>
                                        <td style="padding:10px;">
                                            <span style="padding:4px 8px; border-radius:999px; font-size:0.8rem; background:${r.status === 'paid' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}; color:${r.status === 'paid' ? '#22c55e' : '#f59e0b'};">
                                                ${r.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } catch (e) {
                container.innerHTML = `<div style="color:#ef4444;">Erreur serveur: ${e.message || e}</div>`;
            }
        }

        document.addEventListener('DOMContentLoaded', () => initSubscriptionBanner({
            lockSelector: '.lock-target',
            trialTextPrefix: 'Mode gratuit (Essai 15 jours) : il vous reste ',
            trialTextSuffix: ' jour(s) avant expiration.'
        }));

        if ((window.SUBSCRIPTION_STATE || {}).access_allowed) {
            // Load current settings
            fetch('api.php?action=get_settings')
                .then(res => res.json())
                .then(data => {
                    if (document.getElementById('cycle_start')) {
                        document.getElementById('cycle_start').value = data.cycle_start;
                        document.getElementById('cycle_end').value = data.cycle_end;
                    }
                });

            if ("<?php echo $section; ?>" === "salaries" || "<?php echo $section; ?>" === "functions") {
                loadSettingsData();
            }
            if ("<?php echo $section; ?>" === "services") {
                const btnCreate = document.getElementById("btn-create-service-account");
                if (btnCreate) {
                    btnCreate.addEventListener("click", function (e) {
                        e.preventDefault();
                        createServiceAccount();
                    });
                }
                setCreateServiceStatus('');
                loadServicesAdmin();
            }
            if ("<?php echo $section; ?>" === "payments") {
                loadPaymentsHistory();
            }
        }
        function toggleSettingsSidebar() {
            const sidebar = document.querySelector('.settings-sidebar');
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('settings_sidebar_collapsed', isCollapsed);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const sidebar = document.querySelector('.settings-sidebar');
            if (localStorage.getItem('settings_sidebar_collapsed') === 'false') {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.add('collapsed');
            }
        });
    </script>
</body>

</html>