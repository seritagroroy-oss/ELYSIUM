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

// 1. Requêtes vers api.php → passer directement
if ($uri === '/api.php' || strpos($uri, '/api.php') === 0) {
    require __DIR__ . '/api.php';
    return true;
}

// 2. Requêtes vers db.php ou autres PHP → passer directement
if (preg_match('/\.php$/', $uri)) {
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
        'js'   => 'application/javascript',
        'mjs'  => 'application/javascript',
        'css'  => 'text/css',
        'html' => 'text/html',
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
    // Empêcher le cache navigateur pour les assets JS/CSS
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
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
