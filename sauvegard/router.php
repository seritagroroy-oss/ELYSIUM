<?php
/**
 * router.php - Routeur PHP pour servir l'application React (dist/) + API
 *
 * Ce fichier est utilisé par le serveur PHP intégré via :
 *   php -S localhost:8000 router.php
 *
 * Il distingue :
 *  - Les requêtes vers api.php   → passe directement à api.php
 *  - Les fichiers statiques dans /dist (JS, CSS, images)  → servis directement
 *  - Toute autre URL             → sert dist/index.html (SPA React)
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ─── En-têtes de sécurité globaux ───────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://flagcdn.com; connect-src 'self';");

// ─── Blocage des dossiers interdits ──────────────────────────────────────────
// Bloque l'accès à _A_SUPPRIMER_PLUS_TARD, scratch, et autres dossiers privés
$blocked_folders = ['_A_SUPPRIMER_PLUS_TARD', 'scratch', 'VRAI', '-'];
foreach ($blocked_folders as $folder) {
    if (strpos($uri, '/' . $folder . '/') === 0 || $uri === '/' . $folder) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Accès interdit', 'code' => 403]);
        exit;
    }
}

// ─── Blocage des fichiers sensibles ──────────────────────────────────────────
// Empêche l'accès direct aux logs, fichiers de config, bases de données, etc.
$blocked_extensions = ['log', 'txt', 'env', 'sqlite', 'db', 'sql', 'bak', 'sh', 'md'];
$blocked_files      = ['.env', '.env.example', 'pointage_db.json', 'database.sqlite'];
$uri_ext = strtolower(pathinfo($uri, PATHINFO_EXTENSION));
$uri_basename = basename($uri);

if (in_array($uri_ext, $blocked_extensions) || in_array($uri_basename, $blocked_files)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès interdit', 'code' => 403]);
    exit;
}

// 1. Requêtes vers api.php → passer directement
if ($uri === '/api.php' || strpos($uri, '/api.php') === 0) {
    require __DIR__ . '/api_new.php';
    return true;
}

// 2. Liste blanche stricte des fichiers PHP autorisés directement
// Tout autre fichier .php est bloqué (y compris _A_SUPPRIMER_PLUS_TARD)
$allowed_php = [
    '/api_new.php',
    '/router.php',
    '/index.php',
    '/check_data.php',
    '/sync.php',
    '/check_data.php',
    '/debug_dash.php',
    '/fix_encoding_payroll.php'
];
if (preg_match('/\.php$/', $uri)) {
    if (!in_array($uri, $allowed_php)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Accès interdit', 'code' => 403]);
        exit;
    }
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        require $file;
        return true;
    }
}

// 3. Fichiers statiques du build React (dist/)
$distPath = __DIR__ . '/dist' . $uri;
if ($uri !== '/' && file_exists($distPath) && !is_dir($distPath)) {
    // Définir le bon Content-Type selon l'extension
    $ext = pathinfo($distPath, PATHINFO_EXTENSION);
    $mimes = [
        'js'   => 'application/javascript; charset=UTF-8',
        'mjs'  => 'application/javascript; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'html' => 'text/html; charset=UTF-8',
        'json' => 'application/json',
        'svg'  => 'image/svg+xml',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'webp' => 'image/webp',
        'map'  => 'application/json',
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
    }
    // ─── Cache intelligent ────────────────────────────────────────────────────
    // Les assets Vite ont un hash dans leur nom (ex: index-Dz8bXd2k.js)
    // → ils peuvent être mis en cache très longtemps (1 an)
    // Les autres fichiers (polices, images sans hash) → cache court (1 heure)
    $isHashedAsset = preg_match('/\.[a-f0-9]{8,}\.(js|css|mjs)$/i', $uri);
    if ($isHashedAsset) {
        // Cache 1 an — immutable car le nom du fichier change à chaque build
        header('Cache-Control: public, max-age=31536000, immutable');
    } elseif (in_array($ext, ['woff', 'woff2', 'ttf', 'png', 'jpg', 'jpeg', 'svg', 'ico', 'webp'])) {
        // Cache 1 heure pour les images et polices
        header('Cache-Control: public, max-age=3600');
    } else {
        // Pas de cache pour les autres (json, map, etc.)
        header('Cache-Control: no-cache, no-store, must-revalidate');
    }
    readfile($distPath);
    return true;
}

// 4. Anciens assets PHP (dossier /assets, images, etc.) — fichiers statiques classiques
$rootPath = __DIR__ . $uri;
if ($uri !== '/' && file_exists($rootPath) && !is_dir($rootPath) && !preg_match('/\.php$/', $rootPath)) {
    return false; // PHP le sert directement
}

// 5. Toute autre requête → SPA React (index.html)
$indexHtml = __DIR__ . '/dist/index.html';
if (file_exists($indexHtml)) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1
    header('Pragma: no-cache'); // HTTP 1.0
    header('Expires: 0'); // Proxies
    readfile($indexHtml);
    return true;
}

// 6. Si le build React n'existe pas encore → afficher un message d'aide
http_response_code(503);
echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Build React manquant</title>
<style>body{font-family:monospace;background:#0b1220;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;}
code{background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:6px;font-size:1.1rem;}
pre{background:rgba(0,0,0,0.4);padding:16px 24px;border-radius:10px;text-align:left;line-height:1.8;border:1px solid rgba(255,255,255,0.1);}
</style></head><body>
<h1>⚡ Pointage Pro — Build React absent</h1>
<p>Le dossier <code>dist/</code> n\'existe pas encore. Lancez ces commandes une fois :</p>
<pre>cd frontend
npm install
npm run build</pre>
<p>Ensuite relancez <code>lancer_serveur.bat</code>.</p>
</body></html>';
return true;
