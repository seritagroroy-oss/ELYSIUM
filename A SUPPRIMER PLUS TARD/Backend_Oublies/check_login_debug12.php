<?php
$file = 'C:\laragon\www\pontage\utils.php';
if (function_exists('opcache_invalidate')) {
    $res = opcache_invalidate($file, true);
    echo "opcache_invalidate: " . ($res ? "success" : "failed") . "\n";
} else {
    echo "opcache_invalidate not available\n";
}
if (function_exists('opcache_reset')) {
    $res = opcache_reset();
    echo "opcache_reset: " . ($res ? "success" : "failed") . "\n";
}
