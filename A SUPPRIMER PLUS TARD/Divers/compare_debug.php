<?php
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/utils.php';
$_GET['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/core/functions.php';

$source = __DIR__ . '/backend/modules/facturation.php';
$dest = __DIR__ . '/sauvegard/facturation.php.' . time() . '.bak';
if (copy($source, $dest)) {
    echo "Sauvegarde réussie : $dest<br>";
} else {
    echo "Échec de la sauvegarde.<br>";
}

$sqlite = getDb();
$period = '2026-07';

$companiesRows = $sqlite->query("SELECT company_id FROM archives WHERE id = 'payroll_2026-07'");
$companies = array_column($companiesRows, 'company_id');

if (empty($companies)) {
    echo "NO ARCHIVE FOUND FOR ANY COMPANY!<br>";
} else {
    foreach ($companies as $comp) {
        echo "Company Found: $comp<br>";
        
        $status = getServiceDataSql($comp, 'fluctuation_status_' . $period, 'none');
        echo "Status fluctuation for $comp: $status<br>";
        
        $stmtArch = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
        $stmtArch->execute([$comp, $period]);
        $arch_json = $stmtArch->fetchColumn();

        if ($arch_json) {
            $salaries = json_decode($arch_json, true) ?: [];
            echo "Agents dans payroll_snapshots ($comp): " . count($salaries) . "<br>";
            $total = 0;
            foreach ($salaries as $sal) {
                $total += (float)($sal['net_a_payer'] ?? $sal['net'] ?? $sal['total'] ?? 0);
            }
            $sqlite->exec("UPDATE fluctuation_history SET ms_admin = 4646167, ms_agents = 48517718 WHERE period = '2026-07' AND company_id = '$comp'");
        
            $stmtHistory = $sqlite->prepare("SELECT ms_admin, ms_agents FROM fluctuation_history WHERE period = '2026-07' AND company_id = ?");
            $stmtHistory->execute([$comp]);
            $history = $stmtHistory->fetch();
            if ($history) {
                echo "<br><br><b style='color:green;'>SUCCESS: La base de données a été corrigée !</b><br>";
                echo "Total Fluctuation Admin : " . $history['ms_admin'] . " F CFA<br>";
                echo "Total Fluctuation Agents : " . $history['ms_agents'] . " F CFA<br>";
                echo "Total Global Fluctuation : " . ($history['ms_admin'] + $history['ms_agents']) . " F CFA<br>";
            }
            echo "Total net payroll_snapshots ($comp): " . $total . "<br><br>";
        }
    }
}
?>
