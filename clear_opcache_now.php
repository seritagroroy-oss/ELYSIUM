<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "Opcache reset successfully.\n";
} else {
    echo "Opcache is not enabled or function does not exist.\n";
}
