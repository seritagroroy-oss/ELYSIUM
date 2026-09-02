<?php
define('NO_AUTH', true);
require_once dirname(__DIR__) . '/backend/core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name, hire_date FROM agents WHERE hire_date >= '2026-08-01'");
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Agents trouvés avec hire_date >= 2026-08-01 :\n";
foreach ($agents as $a) {
    echo "- " . $a['name'] . " (" . $a['id'] . ") : " . $a['hire_date'] . "\n";
    $sqlite->exec("UPDATE agents SET hire_date = '2024-01-01' WHERE id = '" . $a['id'] . "'");
    echo "  -> hire_date corrigée à '2024-01-01'\n";
}
echo "Nettoyage terminé.\n";
unlink(__FILE__);
