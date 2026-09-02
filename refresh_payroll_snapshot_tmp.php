<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/backend/core/functions.php';
require_once __DIR__ . '/backend/core/auth_helpers.php';

$sqlite = getDb();

// Find companies
$stmt = $sqlite->query("SELECT id, name FROM companies");
$companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Companies found:\n";
foreach ($companies as $c) {
    echo "- " . $c['id'] . " : " . $c['name'] . "\n";
    $companyKey = $c['id'];
    
    // Check published periods
    $published = getServiceDataSql($companyKey, 'published_periods', []);
    echo "  Published periods: " . json_encode($published) . "\n";
    
    foreach ($published as $period) {
        echo "  Regenerating snapshot for $period...\n";
        $salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);
        savePayrollSnapshot($sqlite, $companyKey, $period, $salaries, null);
        
        // Also check if archives table has it
        $archive_id = 'payroll_' . $period;
        $stmtArch = $sqlite->prepare("SELECT id, data FROM archives WHERE id = ? AND company_id = ?");
        $stmtArch->execute([$archive_id, $companyKey]);
        $archRow = $stmtArch->fetch(PDO::FETCH_ASSOC);
        if ($archRow) {
            $archData = json_decode($archRow['data'], true);
            $archData['salaries'] = $salaries;
            $stmtUp = $sqlite->prepare("UPDATE archives SET data = ? WHERE id = ? AND company_id = ?");
            $stmtUp->execute([json_encode($archData), $archive_id, $companyKey]);
            echo "  Updated archive $archive_id\n";
        }
        
        // Find Zoma in salaries
        foreach ($salaries as $s) {
            if (stripos($s['name'], 'ZOMA') !== false) {
                echo "  -> Found agent " . $s['name'] . ":\n";
                echo "     Days worked: " . ($s['days_worked'] ?? 'N/A') . "\n";
                echo "     Active days: " . ($s['active_days'] ?? 'N/A') . "\n";
                echo "     Absences: " . ($s['absences'] ?? 'N/A') . "\n";
                echo "     Base: " . ($s['base'] ?? 'N/A') . "\n";
                echo "     Deductions: " . ($s['deductions'] ?? 'N/A') . "\n";
                echo "     Total: " . ($s['total'] ?? 'N/A') . "\n";
            }
        }
    }
}
echo "DONE\n";
