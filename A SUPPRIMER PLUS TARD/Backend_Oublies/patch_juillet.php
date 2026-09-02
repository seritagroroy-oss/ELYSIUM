<?php
require_once __DIR__ . '/database.php';

try {
    $sqlite = getDb();
    $company_id = 'comp_default_1'; // Par défaut
    $period = '2026-07';
    
    echo "Processing payroll_snapshots...\n";
    $stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
    $stmt->execute([$company_id, $period]);
    $row = $stmt->fetch();

    if ($row && $row['snapshot']) {
        $salaries = json_decode($row['snapshot'], true);
        
        $dagnogo_entries = [];
        $other_salaries = [];
        
        foreach ($salaries as $sal) {
            if (strtoupper(trim($sal['name'] ?? '')) === 'DAGNOGO MARIAM') {
                $dagnogo_entries[] = $sal;
            } else {
                $other_salaries[] = $sal;
            }
        }
        
        if (count($dagnogo_entries) > 1) {
            $merged = $dagnogo_entries[0];
            $second = $dagnogo_entries[1];
            
            $merged['base'] = ($merged['base'] ?? 0) + ($second['base'] ?? 0);
            $merged['active_days'] = min(30, ($merged['active_days'] ?? 0) + ($second['active_days'] ?? 0));
            $merged['days_worked'] = min(30, ($merged['days_worked'] ?? 0) + ($second['days_worked'] ?? 0));
            $merged['heures_travaillees'] = ($merged['heures_travaillees'] ?? 0) + ($second['heures_travaillees'] ?? 0);
            $merged['absences'] = ($merged['absences'] ?? 0) + ($second['absences'] ?? 0);
            $merged['total'] = ($merged['total'] ?? 0) + ($second['total'] ?? 0);
            
            // Conserver le moyen de paiement s'il est dans la deuxième ligne
            if (empty($merged['profile_data']['payment_method']) && !empty($second['profile_data']['payment_method'])) {
                $merged['profile_data'] = array_merge($merged['profile_data'] ?? [], $second['profile_data'] ?? []);
            }
            
            $other_salaries[] = $merged;
            $new_snapshot = json_encode($other_salaries, JSON_UNESCAPED_UNICODE);
            
            $stmtU = $sqlite->prepare("UPDATE payroll_snapshots SET snapshot = ? WHERE company_id = ? AND period = ?");
            $stmtU->execute([$new_snapshot, $company_id, $period]);
            echo "SUCCESS: payroll_snapshots patched.\n";
        } else {
            echo "INFO: No multiple entries for DAGNOGO MARIAM in snapshots.\n";
        }
    } else {
        echo "INFO: Snapshot for $period not found.\n";
    }

    echo "Processing archives...\n";
    $stmt2 = $sqlite->prepare("SELECT id, data FROM archives WHERE company_id = ? AND period = ?");
    $stmt2->execute([$company_id, $period]);
    $row2 = $stmt2->fetch();

    if ($row2 && $row2['data']) {
        $archiveData = json_decode($row2['data'], true);
        $salaries = $archiveData['salaries'] ?? [];
        
        $dagnogo_entries = [];
        $other_salaries = [];
        
        foreach ($salaries as $sal) {
            if (strtoupper(trim($sal['name'] ?? '')) === 'DAGNOGO MARIAM') {
                $dagnogo_entries[] = $sal;
            } else {
                $other_salaries[] = $sal;
            }
        }
        
        if (count($dagnogo_entries) > 1) {
            $merged = $dagnogo_entries[0];
            $second = $dagnogo_entries[1];
            
            $merged['base'] = ($merged['base'] ?? 0) + ($second['base'] ?? 0);
            $merged['active_days'] = min(30, ($merged['active_days'] ?? 0) + ($second['active_days'] ?? 0));
            $merged['days_worked'] = min(30, ($merged['days_worked'] ?? 0) + ($second['days_worked'] ?? 0));
            $merged['heures_travaillees'] = ($merged['heures_travaillees'] ?? 0) + ($second['heures_travaillees'] ?? 0);
            $merged['absences'] = ($merged['absences'] ?? 0) + ($second['absences'] ?? 0);
            $merged['total'] = ($merged['total'] ?? 0) + ($second['total'] ?? 0);
            
            if (empty($merged['profile_data']['payment_method']) && !empty($second['profile_data']['payment_method'])) {
                $merged['profile_data'] = array_merge($merged['profile_data'] ?? [], $second['profile_data'] ?? []);
            }
            
            $other_salaries[] = $merged;
            $archiveData['salaries'] = $other_salaries;
            
            $new_data = json_encode($archiveData, JSON_UNESCAPED_UNICODE);
            
            $stmtU2 = $sqlite->prepare("UPDATE archives SET data = ? WHERE id = ?");
            $stmtU2->execute([$new_data, $row2['id']]);
            echo "SUCCESS: archives table patched.\n";
        } else {
            echo "INFO: No multiple entries for DAGNOGO MARIAM in archives.\n";
        }
    } else {
         echo "INFO: Archive for $period not found.\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
