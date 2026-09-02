<?php
/**
 * migration_fix_functions.php
 * Corrige les données de fonctions pour toutes les entreprises :
 * 1. Supprime le champ "fullName" parasite sauvegardé en base par un ancien bug frontend
 * 2. Corrige les entrées où name === id (nom cassé) avec un dictionnaire par défaut
 * 3. Ne touche pas aux vrais noms personnalisés des entreprises
 */

require_once __DIR__ . '/database.php';

$sqlite = getDb();

$defaultNames = [
    'AS'      => 'Agent Simple',
    'GA'      => 'Garde Armé',
    'MC'      => 'Maître-Chien',
    'CP'      => 'Chef de Poste',
    'Costume' => 'Agent en Costume',
    'RAF'     => 'Responsable Administratif et Financier',
    'Q'       => 'Agent de Quart',
    'D'       => 'Agent de Descente',
    'CO'      => 'Chef des Opérations',
    'VT'      => 'Voiturier',
    'OPR'     => 'Opérateur Radio',
    'SUP'     => 'Superviseur',
    'CTRL'    => 'Contrôleur',
    'INT'     => 'Intervenant',
    'AP'      => 'Agent de Protection',
];

// Lire toutes les lignes "functions" en base
$stmt = $sqlite->prepare("SELECT service_id, data_key, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute([]);
$rows = $stmt->fetchAll();

$results = [];
$totalFixed = 0;

foreach ($rows as $row) {
    $serviceId = $row['service_id'];
    $functions = json_decode($row['data_value'], true);
    if (!is_array($functions)) continue;

    $changed = false;
    $fixLog = [];

    foreach ($functions as &$func) {
        $id   = $func['id'] ?? '';
        $name = $func['name'] ?? '';

        // 1. Supprimer le champ fullName parasite sauvegardé en base
        if (isset($func['fullName'])) {
            unset($func['fullName']);
            $changed = true;
            $fixLog[] = "[$id] fullName supprimé";
        }

        // 2. Corriger name === id (nom cassé par ancien bug frontend)
        if ($name === $id && isset($defaultNames[$id])) {
            $func['name'] = $defaultNames[$id];
            $changed = true;
            $fixLog[] = "[$id] name '$name' → '{$defaultNames[$id]}'";
        }
    }
    unset($func);

    if ($changed) {
        // Sauvegarder la version corrigée
        $stmtUpdate = $sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'functions'");
        $stmtUpdate->execute([json_encode($functions, JSON_UNESCAPED_UNICODE), $serviceId]);
        $totalFixed++;
        $results[] = ['service_id' => $serviceId, 'fixes' => $fixLog, 'new_data' => $functions];
    }
}

header('Content-Type: application/json');
echo json_encode([
    'success'      => true,
    'total_fixed'  => $totalFixed,
    'details'      => $results,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
