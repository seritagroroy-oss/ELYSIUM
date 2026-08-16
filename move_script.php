<?php
$old = 'c:/laragon/www/pontage/ROADMAP_PHASE_2.html';
$dir = 'c:/laragon/www/pontage/mise_a_jour';
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}
if (file_exists($old)) {
    rename($old, $dir . '/ROADMAP_PHASE_2.html');
    echo "Successfully moved ROADMAP_PHASE_2.html to mise_a_jour directory.";
} else {
    echo "File not found.";
}
