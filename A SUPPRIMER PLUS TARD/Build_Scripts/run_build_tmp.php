<?php
// Script temporaire pour lancer le build frontend
// À supprimer après utilisation
$output = [];
$return_code = 0;
chdir('C:\\laragon\\www\\pontage\\frontend');
exec('npm run build 2>&1', $output, $return_code);
echo json_encode([
    'return_code' => $return_code,
    'output' => implode("\n", $output)
]);
