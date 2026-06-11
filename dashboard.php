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

$__perms = getUserPermissionsByEmail($_SESSION['user_id']);
$_SESSION['permissions'] = $__perms;
if (($_SESSION['user_role'] ?? '') !== 'admin' && empty($__perms['can_view_dashboard'])) {
    header('Location: index.php');
    exit;
}
$subscriptionState = getUserSubscriptionState($_SESSION['user_id']);
$db = getData();
$has_seen_onboarding = $db['users'][$_SESSION['user_id']]['has_seen_onboarding'] ?? false;
$all_services = [];
$current_switched = $_SESSION['switched_service_id'] ?? '';
if (($_SESSION['user_role'] ?? '') === 'super_admin') {
    $all_services = $db['services'] ?? [];
}
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo __('dashboard'); ?> - Pointage Pro</title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#3b82f6">
    <link rel="apple-touch-icon" href="assets/icon.png">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/scrollbar.css">
    <link rel="stylesheet" href="assets/css/subscription-banner.css">
    <style>
        :root {
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --bg-dark: #0f172a;
            --bg-sidebar: #1e293b;
            --bg-card: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --success: #22c55e;
            --danger: #ef4444;
            --warning: #f59e0b;
        }

        .lang-radio-group {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 5px;
        }

        .lang-radio-item {
            position: relative;
        }

        .lang-radio-item input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }

        .lang-radio-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-muted);
        }

        .lang-radio-item input:checked+.lang-radio-label {
            background: rgba(59, 130, 246, 0.15);
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .lang-radio-label .flag {
            font-size: 1.5rem;
            margin-bottom: 4px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .sidebar {
            width: 280px;
            background-color: var(--bg-sidebar);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 1.5rem;
            flex-shrink: 0;
            overflow-y: auto;
            overflow-x: hidden;
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
            font-weight: 700;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--primary);
        }

        .user-profile {
            background: var(--bg-card);
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            border: 1px solid var(--border);
        }

        .user-profile .name {
            font-weight: 600;
            font-size: 0.95rem;
        }

        .user-profile .role {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .nav-section {
            margin-bottom: 2rem;
        }

        .nav-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 1rem;
            padding-left: 0.5rem;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text-main);
            text-decoration: none;
            margin-bottom: 0.25rem;
            font-size: 0.95rem;
        }

        .nav-item:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .nav-item.active {
            background: var(--primary);
            color: white;
        }

        .nav-item i {
            width: 20px;
            text-align: center;
            font-size: 1.1rem;
        }

        .sites-list {
            flex-grow: 1;
            margin-top: 1rem;
        }

        .site-btn {
            padding: 0.6rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 5px;
            font-size: 0.9rem;
            transition: all 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .site-btn:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .site-btn.active {
            background: rgba(255, 255, 255, 0.1);
            border-left: 3px solid white;
        }

        /* Main Content */
        .main-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);
        }

        header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        header h2 {
            font-weight: 600;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .subscription-locked .content-area {
            opacity: 0.45;
            pointer-events: none;
            filter: grayscale(0.2);
        }

        .subscription-locked .header-actions .btn {
            opacity: 0.55;
            pointer-events: none;
        }

        .subscription-locked .sidebar .nav-item {
            opacity: 0.6;
            pointer-events: none;
        }

        .subscription-locked .sidebar .nav-item:last-child {
            pointer-events: auto;
            opacity: 1;
        }

        /* Grid Area */
        .content-area {
            flex-grow: 1;
            padding: 2rem;
            overflow: auto;
            transition: padding 0.3s ease;
        }

        /* Excel Mode (Fullscreen Grid) */
        body.excel-mode .sidebar,
        body.excel-mode header,
        body.excel-mode #site-toolbar,
        body.excel-mode #subscription-banner {
            display: none !important;
        }

        body.excel-mode .content-area {
            padding: 0 !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9000;
            background: var(--bg-dark);
        }

        body.excel-mode .attendance-card {
            border: none;
            border-radius: 0;
            padding: 0;
        }

        #exit-excel-btn {
            display: none;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
            background: #ef4444;
            color: white;
            border: 2px solid rgba(255,255,255,0.2);
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }

        #exit-excel-btn:hover {
            transform: scale(1.05);
            background: #dc2626;
        }

        body.excel-mode #exit-excel-btn {
            display: flex !important;
            align-items: center;
            gap: 10px;
        }

        .attendance-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            min-width: fit-content;
            transition: all 0.3s ease;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            font-size: 0.85rem;
        }

        th {
            background: #1e293b;
            padding: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            border: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 25;
            /* Higher than subsite headers */
        }

        /* Freeze first column in header with shadow separator */
        thead tr th:first-child {
            position: sticky;
            left: 0;
            z-index: 35;
            background: #1e293b;
            border-right: none;
            box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.5);
        }

        /* Border line for the frozen column */
        thead tr th:first-child::after,
        .agent-name::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: 2px;
            background: var(--primary);
            box-shadow: 0 0 10px var(--primary);
        }

        /* Ensure second row of header is also sticky */
        thead tr:nth-child(2) th {
            top: 45px;
        }

        /* Second header row first column */
        thead tr:nth-child(2) th:first-child {
            z-index: 36;
        }

        td {
            padding: 0.5rem;
            border: 1px solid var(--border);
            text-align: center;
        }

        .agent-name {
            text-align: left;
            padding-left: 1.25rem;
            font-weight: 600;
            min-width: 200px;
            position: sticky;
            left: 0;
            background: #1e293b;
            z-index: 10;
            transition: all 0.3s ease;
            box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.5);
        }

        /* Row Hover: Minimal interaction, only borders for guidance */
        tr:hover td {
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tr:hover .agent-name {
            background: #232d3d !important;
            color: white;
        }

        .cell {
            width: 38px;
            height: 38px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            background-color: #f8fafc;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            position: relative;
            font-weight: 700;
        }

        /* Modern Crosshair vertical line - triggered on THEAD TH */
        th.radar-active {
            background-color: var(--primary) !important;
            color: white !important;
            position: sticky;
            z-index: 40;
            /* Above regular headers */
            box-shadow: 0 5px 20px rgba(59, 130, 246, 0.5);
        }

        /* Le survol individuel (.cell:hover) a été désactivé pour les cases blanches */

        /* RESTORED: Modern Crosshair vertical line - triggered on THEAD TH */
        th.radar-active::after {
            content: '';
            position: absolute;
            top: 100%;
            left: -1px;
            width: calc(100% + 2px);
            height: 5000px;
            background: rgba(255, 255, 255, 0.03);
            pointer-events: none;
            z-index: -1;
            border-left: 1px solid rgba(255, 255, 255, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        }

        .cell.half {
            height: 18px;
            font-size: 0.7rem;
        }

        /* Specific Halo Glow for Status Cells (Replaces the generic white hover) */
        .cell.status-1:hover {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
            /* Green Glow */
            border-color: #4ade80 !important;
            filter: brightness(1.1);
        }

        .cell.status-A:hover {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
            /* Red Glow */
            border-color: #f87171 !important;
            filter: brightness(1.1);
        }

        .cell.status-M:hover {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
            /* Orange Glow */
            border-color: #fbbf24 !important;
            filter: brightness(1.1);
        }

        .cell.status-1 {
            background-color: var(--success);
            color: white;
        }

        .cell.status-A {
            background-color: var(--danger);
            color: white;
        }

        .cell.status-S-1 {
            background-color: var(--primary);
            color: white;
        }

        .cell.status-S-empty {
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cell.status-M {
            background-color: #f59e0b;
            color: white !important;
            font-size: 0.65rem;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 0 4px;
            text-transform: uppercase;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
        }

        /* Modals */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 100;
            align-items: center;
            justify-content: center;
        }

        /* Ensure dialogs appear above the selection overlay */
        #modal-add-site,
        #modal-add-subsite,
        #modal-add-agent {
            z-index: 200;
        }

        .modal-content {
            background: var(--bg-sidebar);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 2.5rem;
            width: 90%;
            max-width: 500px;
        }

        .modal-header {
            margin-bottom: 1.5rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--primary-hover);
        }

        .subsite-header {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
            color: white;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.1em;
            text-align: left;
            padding: 1.25rem;
            border-left: 6px solid #718096;
            /* Grey instead of blue */
            position: sticky;
            top: 45px;
            z-index: 20;
            backdrop-filter: blur(15px);
            cursor: pointer;
            user-select: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .subsite-header:hover {
            padding-left: 1.5rem;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
        }

        .subsite-name {
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            transform: none;
            white-space: nowrap;
            line-height: 1.2;
            display: inline-block;
        }

        .subsite-header>div {
            width: 100%;
            min-width: 0;
        }

        @media (max-width: 900px) {
            .subsite-name {
                min-width: 0;
                max-width: 48vw;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        .agent-count-badge {
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
        }

        .subsite-header i.fa-chevron-down {
            transition: transform 0.4s ease;
            color: #718096;
        }

        .subsite-collapsed i.fa-chevron-down {
            transform: rotate(-180deg);
        }

        /* Improved collapsing animation */
        tbody tr {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .subsite-collapsed tr:not(.subsite-header-row) {
            opacity: 0;
            pointer-events: none;
        }

        /* Period Selector */
        .period-nav {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(255, 255, 255, 0.05);
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: 1px solid var(--border);
        }

        .period-nav button {
            background: transparent;
            border: none;
            color: var(--text-main);
            cursor: pointer;
            font-size: 1.2rem;
        }

        .action-icon:hover {
            color: var(--text-main);
        }

        /* Site Selection Grid */
        .site-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 1rem;
        }

        @keyframes rotate-bg {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .site-card {
            position: relative;
            border-radius: 20px;
            padding: 1.5px;
            /* Border thickness */
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            /* Base border color */
        }

        .site-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(transparent,
                    var(--primary),
                    transparent 30%);
            animation: rotate-bg 4s linear infinite;
            opacity: 0;
            transition: opacity 0.5s;
            z-index: 0;
        }

        .site-card:hover::before,
        .site-card.active::before {
            opacity: 1;
        }

        .site-card-inner {
            position: relative;
            background: #1e293b;
            /* Match sidebar bg */
            border-radius: 19px;
            padding: 2rem 1.5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            height: 100%;
            width: 100%;
            z-index: 1;
            backdrop-filter: blur(10px);
            transition: 0.3s;
        }

        .site-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
        }

        .site-card i {
            font-size: 3rem;
            color: var(--primary);
            opacity: 0.9;
            transition: 0.4s;
            filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
        }

        .site-card:hover i {
            transform: scale(1.15) rotate(5deg);
            filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.6));
        }

        .site-card .name {
            font-weight: 700;
            font-size: 1.25rem;
            color: var(--text-main);
            letter-spacing: -0.5px;
        }

        .site-card .status {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }

        .site-card.active .site-card-inner {
            background: rgba(59, 130, 246, 0.1);
        }

        .site-card.active::after {
            content: 'SÉLECTIONNÉ';
            position: absolute;
            top: 12px;
            right: -30px;
            background: var(--primary);
            color: white;
            font-size: 0.55rem;
            font-weight: 900;
            padding: 4px 35px;
            transform: rotate(45deg);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            z-index: 10;
        }

        /* THEME CLAIR (Light Mode) */
        body.light-theme {
            --bg-dark: #f8fafc;
            --bg-sidebar: #ffffff;
            --bg-card: #ffffff;
            --border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
        }
        body.light-theme .modal-content { background: rgba(255, 255, 255, 0.95); color: var(--text-main); }
        body.light-theme table { color: var(--text-main); }
        body.light-theme .nav-item { color: var(--text-muted); }
        body.light-theme .user-profile { background: #f1f5f9; }

        /* TOAST NOTIFICATIONS */
        #toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; }
        .toast { background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(10px); color: white; padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-left: 4px solid var(--primary); transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; align-items: center; gap: 10px; }
        .toast.show { transform: translateX(0); }
        .toast.success { border-left-color: var(--success); }
        .toast.error { border-left-color: var(--danger); }
        .toast.warning { border-left-color: var(--warning); }

        /* SKELETON LOADING */
        .skeleton { background: linear-gradient(90deg, var(--bg-card) 25%, rgba(255,255,255,0.05) 50%, var(--bg-card) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; color: transparent !important; border:none!important; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* MODAL ANIMATIONS & GLASSMORPHISM */
        .modal { backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity 0.3s; display: flex; }
        .modal.active { opacity: 1; pointer-events: all; }
        .modal-content { background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); transform: scale(0.9); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .modal.active .modal-content { transform: scale(1); }
        
        /* HEADER KPIs */
        .header-kpi { display: flex; gap: 10px; margin-right: auto; margin-left: 30px; }
        .kpi-pill { background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    </style>
</head>

<body>
    <div id="toast-container"></div>
    <aside class="sidebar collapsed">
        <div class="logo">
            <i class="fas fa-shield-halved"></i>
            <span>Pointage Pro</span>
        </div>

        <div class="user-profile">
            <div class="name">
                <?php echo htmlspecialchars($_SESSION['user_name'] ?? ''); ?>
            </div>
            <div class="role">
                <?php echo htmlspecialchars($_SESSION['user_service'] ?? ''); ?>
                <br><span style="font-size:10px; color: yellow;">Role: <?php echo htmlspecialchars($_SESSION['user_role'] ?? 'none'); ?></span>
            </div>
        </div>

        <div class="nav-section">
            <div class="nav-title"><?php echo __('dashboard'); ?></div>
            <a href="dashboard.php" class="nav-item active" id="btn-dashboard">
                <i class="fas fa-chart-line"></i>
                <span><?php echo __('dashboard'); ?></span>
            </a>
            <a href="kiosk.php" class="nav-item">
                <i class="fas fa-camera"></i>
                <span>Pointeuse Kiosque</span>
            </a>
            <?php if (($_SESSION['user_role'] ?? '') === 'admin' || !empty($__perms['can_view_archives'])): ?>
                <a href="archives.php" class="nav-item">
                    <i class="fas fa-history"></i>
                    <span><?php echo __('previous_records'); ?></span>
                </a>
            <?php endif; ?>
            <?php if (($_SESSION['user_role'] ?? '') === 'admin' || !empty($__perms['can_view_salaries'])): ?>
                <a href="salaires.php" class="nav-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span><?php echo __('manage_salaries'); ?></span>
                </a>
                <a href="analytics.php" class="nav-item">
                    <i class="fas fa-chart-pie"></i>
                    <span>Analytiques RH</span>
                </a>
            <?php endif; ?>
            
            <?php if (($_SESSION['user_role'] ?? '') === 'super_admin' || ($_SESSION['user_role'] ?? '') === 'admin'): ?>
                <a href="settings.php?section=services" class="nav-item">
                    <i class="fas fa-users-gear"></i>
                    <span><?php echo __('manage_services'); ?></span>
                </a>
            <?php endif; ?>
            <a href="communication.php" class="nav-item">
                <i class="fas fa-comments"></i>
                <span>Communication & Tickets</span>
            </a>
            <a href="#" class="nav-item" id="btn-notifications" onclick="openNotificationsModal()">
                <i class="fas fa-bell"></i>
                <span><?php echo __('notifications'); ?></span>
                <span id="notif-count"
                    style="background: var(--danger); font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; margin-left: auto; display: none;">0</span>
            </a>
            <?php if (($_SESSION['user_role'] ?? '') === 'admin' || !empty($__perms['can_view_settings'])): ?>
                <a href="settings.php" class="nav-item">
                    <i class="fas fa-cog"></i>
                    <span><?php echo __('settings'); ?></span>
                </a>
            <?php endif; ?>
        </div>

        <div class="nav-section">
            <div class="nav-title">Navigation</div>
            <a href="#" class="nav-item" onclick="openSiteSelectionModal()">
                <i class="fas fa-building-circle-check"></i>
                <span>Mes Sites</span>
            </a>
        </div>

        <div class="nav-title" style="display: none;">Mes Sites</div>
        <div class="sites-list" id="sites-list" style="display: none;">
            <!-- Hidden by default, triggered through modal -->
        </div>



        <div class="nav-item" onclick="logout()" style="margin-top: auto; color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i>
            <span>Déconnexion</span>
        </div>
    </aside>
    <div class="sidebar-overlay" onclick="toggleSidebar()"></div>

    <button id="exit-excel-btn" onclick="toggleExcelMode()">
        <i class="fas fa-compress"></i> Quitter le Mode Plein Écran
    </button>

    <main class="main-content">
        <header>
            <div style="display: flex; align-items: center; gap: 15px;">
                <button class="btn" onclick="toggleSidebar()" style="background: rgba(255,255,255,0.05); color: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border);"><i class="fas fa-bars"></i></button>
                <h2 id="current-site-title"><?php echo __('select_site'); ?></h2>
                
                <?php if (($_SESSION['user_role'] ?? '') === 'super_admin'): ?>
                <select id="workspace-switcher" onchange="switchWorkspace(this.value)" style="background: var(--bg-sidebar); color: white; border: 1px solid var(--border); border-radius: 8px; padding: 0.4rem 1rem; margin-left: 15px;">
                    <option value="">Mon Espace (<?php echo htmlspecialchars($_SESSION['user_service']); ?>)</option>
                    <?php foreach($all_services as $svc): ?>
                        <option value="<?php echo htmlspecialchars($svc['id']); ?>" <?php echo $current_switched === $svc['id'] ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($svc['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <script>
                async function switchWorkspace(serviceId) {
                    try {
                        const res = await fetch('api.php?action=switch_service', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ service_id: serviceId })
                        });
                        const data = await res.json();
                        if(data.success) {
                            window.location.reload();
                        } else {
                            showToast(data.message || 'Erreur', 'error');
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }
                </script>
                <?php endif; ?>
                
                <div class="header-kpi" id="live-kpi-container" style="display:none;">
                    <div class="kpi-pill"><span style="color:var(--success);"><i class="fas fa-check-circle"></i></span> <span id="kpi-p">0</span></div>
                    <div class="kpi-pill"><span style="color:var(--danger);"><i class="fas fa-times-circle"></i></span> <span id="kpi-a">0</span></div>
                    <div class="kpi-pill"><span style="color:var(--warning);"><i class="fas fa-bed"></i></span> <span id="kpi-off">0</span></div>
                </div>
            </div>
            
            <div class="header-actions">
                <button class="btn" onclick="toggleTheme()" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border);"><i class="fas fa-moon" id="theme-icon"></i></button>
                
                <?php if (($_SESSION['user_role'] ?? '') === 'admin' || !empty($__perms['can_edit_dashboard'])): ?>
                    <button class="btn btn-primary" id="add-subsite-btn"
                        style="display: none; background: var(--bg-sidebar); border: 1px solid var(--border);"
                        onclick="openAddSubsiteModal()">
                        <i class="fas fa-folder-plus"></i> <?php echo __('new_zone'); ?>
                    </button>
                    <button class="btn btn-primary" id="init-month-btn"
                        style="display: none; background: var(--warning); color: black;" onclick="initializeMonth()">
                        <i class="fas fa-magic"></i> <?php echo __('init_month'); ?>
                    </button>
                    <button class="btn" id="clear-mutations-btn" style="display: none; background: #64748b; color: white;"
                        onclick="clearSiteMutations()">
                        <i class="fas fa-eraser"></i> <?php echo __('clear_mutations'); ?>
                    </button>
                    <button class="btn btn-primary" id="share-btn" style="display: none; background: #ea580c; border:none;"
                        onclick="archiveAllSites()">
                        <i class="fas fa-save"></i> <?php echo __('save_records'); ?>
                    </button>
                <?php endif; ?>
                <div class="period-nav">
                    <button onclick="changePeriod(-1)"><i class="fas fa-chevron-left"></i></button>
                    <span id="current-period-display">...</span>
                    <button onclick="changePeriod(1)"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </header>
        
        <div id="site-toolbar" style="display:none; padding: 1rem 2rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); justify-content: space-between; align-items: center; gap: 1rem;">
            <div style="display: flex; gap: 10px; flex: 1;">
                <div style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                    <input type="text" id="search-agent" placeholder="Rechercher un agent..." onkeyup="filterAgents()" style="padding: 0.6rem 1rem 0.6rem 2.2rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: white; width: 250px; font-family: 'Outfit', sans-serif;">
                </div>
                <button class="btn" onclick="openLegendModal()" style="background: rgba(255,255,255,0.05); color: white;"><i class="fas fa-info-circle"></i> Légende</button>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn" style="background: rgba(255,255,255,0.05); color: white;" onclick="toggleExcelMode()"><i class="fas fa-expand"></i> Mode Excel</button>
                <button class="btn btn-primary" style="background: #10b981; border: none;" onclick="exportToCSV()"><i class="fas fa-file-csv"></i> Exporter CSV</button>
            </div>
        </div>

        <div id="subscription-banner" class="subscription-banner"
            style="display:none; margin: 0 2rem; margin-top: 0.9rem;">
            <div class="txt" id="subscription-banner-text"></div>
            <div style="display:flex; gap:8px;">
                <a href="subscription.php" id="btn-go-premium" class="btn btn-primary"
                    style="padding:0.4rem 0.7rem; text-decoration:none; font-size: 0.85rem;">
                    Passer en Premium
                </a>
            </div>
        </div>

        <section class="content-area" id="main-grid-area">
            <div
                style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                <div style="text-align: center;">
                    <i class="fas fa-location-dot" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p><?php echo __('choose_site_sidebar'); ?></p>
                </div>
            </div>
        </section>
    </main>

    <!-- Modals -->
    <div id="modal-add-site" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Ajouter un Nouveau Site</h3>
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Nom du Site</label>
                <input type="text" id="new-site-name"
                    style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="addSite()">Créer le Site</button>
            </div>
        </div>
    </div>

    <div id="modal-add-subsite" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Ajouter une Nouvelle Zone / Poste</h3>
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Nom de la Zone</label>
                <input type="text" id="new-subsite-name"
                    style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;"
                    placeholder="ex: Poste Garde, Zone Nord...">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="addSubsite()">Ajouter</button>
            </div>
        </div>
    </div>

    <div id="modal-rename-subsite" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Modifier le Nom de la Zone</h3>
            </div>
            <input type="hidden" id="rename-subsite-id">
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Nouveau Nom</label>
                <input type="text" id="rename-subsite-name"
                    style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="renameSubsite()">Renommer</button>
            </div>
        </div>
    </div>

    <div id="modal-agent-function" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Choisir la Fonction</h3>
            </div>
            <input type="hidden" id="function-target-agent-id">
            <div id="function-modal-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Loaded via JS -->
            </div>
            <button class="btn" onclick="closeModals()"
                style="width: 100%; margin-top: 15px; background: var(--danger); color: white;">Annuler</button>
        </div>
    </div>

    <div id="modal-agent-shift" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Type de Service & Planning</h3>
            </div>
            <input type="hidden" id="shift-target-agent-id">

            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.9rem;">1. Sélectionner le Type</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn" style="background: rgba(255,255,255,0.1); color: white;"
                        onclick="updateAgentInfo('shift_type', 'Jour')">Jour</button>
                    <button class="btn" style="background: rgba(255,255,255,0.1); color: white;"
                        onclick="updateAgentInfo('shift_type', 'Nuit')">Nuit</button>
                    <button class="btn" style="background: var(--primary); color: white;"
                        onclick="updateAgentInfo('shift_type', '24h')">24h</button>
                    <button class="btn" style="background: var(--primary); color: white;"
                        onclick="updateAgentInfo('shift_type', '48h')">48h</button>
                    <button class="btn" style="background: var(--primary); color: white;"
                        onclick="updateAgentInfo('shift_type', '72h')">72h</button>
                </div>
            </div>

            <div id="pattern-options" style="display: none; border-top: 1px solid var(--border); padding-top: 20px;">
                <p style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.9rem;">2. Générer le planning
                    (Rotation)</p>
                <div id="pattern-list" style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- Options generated via JS -->
                </div>
            </div>

            <button class="btn" onclick="closeModals()"
                style="width: 100%; margin-top: 15px; background: var(--danger); color: white;">Fermer</button>
        </div>
    </div>

    <div id="modal-add-agent" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Ajouter un Agent</h3>
            </div>
            <input type="hidden" id="target-subsite-id">
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Nom Complet de
                    l'Agent</label>
                <input type="text" id="new-agent-name"
                    style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="addAgent()">Ajouter</button>
            </div>
        </div>
    </div>

    <div id="modal-site-selection" class="modal">
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <div>
                    <h3>Sélectionner un Site</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Accédez au pointage de vos différents
                        chantiers et établissements.</p>
                </div>
            </div>
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px; margin: 1.5rem 0;">
                <div id="site-selection-grid" class="site-grid">
                    <!-- Loaded via JS -->
                </div>
            </div>
            <div
                style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                <?php if ($_SESSION['user_role'] == 'admin'): ?>
                    <button class="btn btn-primary" onclick="openAddSiteModal()"
                        style="background: var(--primary); color: white; border: none; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                        <i class="fas fa-plus"></i> Nouveau Site
                    </button>
                <?php endif; ?>
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Fermer</button>
            </div>
        </div>
    </div>

    <div id="modal-notifications" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Notifications & Rapports Partagés</h3>
            </div>
            <div id="notifications-list" style="max-height: 400px; overflow-y: auto;">
                <!-- Loaded via JS -->
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 1.5rem;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Fermer</button>
            </div>
        </div>
    </div>

    <div id="modal-mutation" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Mutation d'Agent</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:5px;">Marquer l'agent comme transféré
                    sur un autre site.</p>
            </div>
            <input type="hidden" id="mutation-target-agent-id">
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Nouvelle
                    Destination</label>
                <input type="text" id="mutation-destination" placeholder="Ex: Boutique A, Chantier B..."
                    style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Date Début</label>
                    <input type="date" id="mutation-start"
                        style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Date Fin</label>
                    <input type="date" id="mutation-end"
                        style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()"
                    style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="submitMutation()">Enregistrer Mutation</button>
            </div>
        </div>
    </div>


    <div id="modal-deploy-extra" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Déployer un Extra</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:5px;">Associer temporairement un extra à ce site pour cette période.</p>
            </div>
            <input type="hidden" id="deploy-extra-target-subsite">
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">Sélectionner l'Extra</label>
                <select id="deploy-extra-agent" style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
                    <!-- Rempli par JavaScript -->
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">A partir du</label>
                <input type="date" id="deploy-extra-date" style="width: 100%; padding: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; color: white;">
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn" onclick="closeModals()" style="background: rgba(255,255,255,0.05); color: white;">Annuler</button>
                <button class="btn btn-primary" onclick="submitDeployExtra()">Déployer</button>
            </div>
        </div>
    </div>

    <div id="modal-legend" class="modal">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Légende des Pointages</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
                <div style="display:flex; align-items:center;"><span style="display:inline-block; width:20px; height:20px; background:var(--success); border-radius:4px; margin-right:15px;"></span> <span><b>Présent (1) :</b> L'agent a effectué son service.</span></div>
                <div style="display:flex; align-items:center;"><span style="display:inline-block; width:20px; height:20px; background:var(--danger); border-radius:4px; margin-right:15px;"></span> <span><b>Absent (A) :</b> L'agent était absent.</span></div>
                <div style="display:flex; align-items:center;"><span style="display:inline-block; width:20px; height:20px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.2); border-radius:4px; margin-right:15px;"></span> <span><b>Repos (OFF) :</b> Case vide, l'agent est en repos.</span></div>
                <div style="display:flex; align-items:center;"><span style="display:inline-block; width:20px; height:20px; background:var(--warning); border-radius:4px; margin-right:15px;"></span> <span><b>Mutation :</b> L'agent a été muté sur un autre site ce jour-là.</span></div>
            </div>
            <button class="btn" onclick="closeModals()" style="width: 100%; background: rgba(255,255,255,0.05); color: white;">Fermer</button>
        </div>
    </div>

    <!-- Scripts -->
    <script>
        window.USER_CAN_EDIT_DASHBOARD = <?php echo (($_SESSION['user_role'] ?? '') === 'admin' || !empty($__perms['can_edit_dashboard'])) ? 'true' : 'false'; ?>;
        window.SUBSCRIPTION_STATE = <?php echo json_encode($subscriptionState, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); ?>;
        
        // Initialiser l'état de la sidebar, du mode excel et du thème
        document.addEventListener('DOMContentLoaded', () => {
            const sidebar = document.querySelector('.sidebar');
            if (localStorage.getItem('sidebar_collapsed') === 'false') {
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.add('collapsed');
            }
            if (localStorage.getItem('excel_mode') === 'true') {
                document.body.classList.add('excel-mode');
            }
            if (localStorage.getItem('light_theme') === 'true') {
                document.body.classList.add('light-theme');
                document.getElementById('theme-icon').classList.replace('fa-moon', 'fa-sun');
            }
            // Enregistrement du Service Worker (PWA)
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js').catch(err => console.error("SW Registration failed:", err));
            }
        });

        function toggleTheme() {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('light_theme', isLight);
            const icon = document.getElementById('theme-icon');
            if(isLight) icon.classList.replace('fa-moon', 'fa-sun');
            else icon.classList.replace('fa-sun', 'fa-moon');
        }

        // Fonction Globale pour les Toasts
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            let icon = 'check-circle';
            if(type === 'error') icon = 'times-circle';
            if(type === 'warning') icon = 'exclamation-triangle';
            toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);
            
            // Remove after 3s
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }

        // Surcharger les modales pour l'animation
        const originalOpenModals = document.querySelectorAll('.modal');
        originalOpenModals.forEach(m => {
            m.style.display = 'flex'; // Toujours flex mais opacité 0
            m.classList.remove('active');
        });

        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar_collapsed', isCollapsed);
        }

        function toggleExcelMode() {
            const isExcel = document.body.classList.toggle('excel-mode');
            localStorage.setItem('excel_mode', isExcel);
        }

        async function changeLanguage(lang) {
            try {
                await fetch('api.php?action=set_lang', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lang })
                });
                window.location.reload();
            } catch (err) {
                console.error('Error changing language:', err);
            }
        }
    </script>
    
    <!-- Modale Onboarding -->
    <div id="onboarding-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 600px; text-align: center;">
            <div class="modal-header">
                <h2>Bienvenue sur Pointage Pro ! 🎉</h2>
            </div>
            <div style="margin-bottom: 20px;">
                <p style="color: var(--text-muted); margin-bottom: 20px;">Découvrez comment utiliser l'application en quelques secondes.</p>
                <!-- Image de remplacement temporaire pour la vidéo -->
                <div style="background: rgba(0,0,0,0.5); border-radius: 12px; padding: 40px; border: 1px solid var(--border);">
                    <i class="fas fa-play-circle" style="font-size: 4rem; color: var(--primary); margin-bottom: 15px;"></i>
                    <p>Vidéo de présentation à venir...</p>
                </div>
            </div>
            <button class="btn btn-primary" onclick="completeOnboarding()" style="width: 100%;">Commencer à utiliser l'application</button>
        </div>
    </div>

    <script>
        const HAS_SEEN_ONBOARDING = <?php echo $has_seen_onboarding ? 'true' : 'false'; ?>;
        
        // Exécution immédiate (le DOM est déjà chargé à ce stade)
        alert("Bienvenue ! Statut Onboarding : " + HAS_SEEN_ONBOARDING);
        console.log("Statut Onboarding :", HAS_SEEN_ONBOARDING);
        
        if (!HAS_SEEN_ONBOARDING) {
            const modal = document.getElementById('onboarding-modal');
            if (modal) {
                alert("La modale a été trouvée, affichage en cours...");
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.style.visibility = 'visible';
                modal.style.zIndex = '999999';
                modal.style.background = 'rgba(255, 0, 0, 0.5)'; // Fond rouge temporaire pour forcer la visibilité
                modal.classList.add('active');
            } else {
                alert("Erreur: La modale onboarding-modal est introuvable !");
            }
        }

        async function completeOnboarding() {
            const modal = document.getElementById('onboarding-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            try {
                await fetch('api.php?action=complete_onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                console.error('Error saving onboarding status:', err);
            }
        }
    </script>

    <script src="assets/js/subscription-banner.js?v=<?= time() ?>"></script>
    <script src="assets/js/app.js?v=<?= time() ?>"></script>
</body>

</html>