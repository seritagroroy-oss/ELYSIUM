<?php
require 'database.php';
require 'functions.php';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['user_role'] = 'admin';
$_GET['period'] = '2027-11';

ob_start();
$data = []; // Mock data
$action = 'get_dashboard_history';

// Inline the case logic directly to avoid module routing issues
        $period = $_GET['period'] ?? date('Y-m');
        $sqlite = getDb();
        $user_role = $_SESSION['user_role'] ?? '';
        $user_service = strtolower($_SESSION['user_service'] ?? '');
        $serviceKey = $_SESSION['service_id'] ?? null;
        $companyKey = $_SESSION['company_id'] ?? null;

        if (strpos($user_role, 'admin') !== false || strpos($user_service, 'compta') !== false || strpos($user_service, 'rh') !== false) {
            $target_col = 'company_id';
            $target_val = $companyKey;
        } else {
            $scope = $_GET['scope'] ?? 'service';
            $target_col = ($scope === 'company') ? 'company_id' : 'service_id';
            $target_val = ($scope === 'company') ? $companyKey : $serviceKey;
        }

        $months = [];
        $baseDate = DateTime::createFromFormat('Y-m-d', $period . '-01');
        if ($baseDate) {
            for ($i = 5; $i >= 0; $i--) {
                $d = clone $baseDate;
                $d->modify("-$i month");
                $months[] = $d->format('Y-m');
            }
        }

        $published = getPublishedPeriodsArray($sqlite, $companyKey);
        
        $results = [];
        foreach ($months as $m) {
            $totalMasse = 0;
            $found_in_db = false;
            
            // 1. Check Archives
            $archive_id = 'payroll_' . $m;
            $stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = ? AND $target_col = ?");
            $stmt->execute([$archive_id, $target_val]);
            $row = $stmt->fetch();
            if ($row && isset($row['data'])) {
                $archive = json_decode($row['data'], true);
                if (isset($archive['salaries']) && is_array($archive['salaries'])) {
                    foreach ($archive['salaries'] as $s) {
                        $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                    }
                    $found_in_db = true;
                }
            }
            
            // 2. Check Snapshots (if published but not archived)
            if (!$found_in_db && in_array($m, $published)) {
                $snap = getPayrollSnapshot($sqlite, $companyKey, $m);
                if ($snap) {
                    $snapData = json_decode($snap, true);
                    if (is_array($snapData)) {
                        foreach ($snapData as $s) {
                            $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                        }
                        $found_in_db = true;
                    }
                }
            }
            
            // 3. Fallback to Live Data
            if (!$found_in_db) {
                // To avoid calling require inside a loop or relying on salaries.php inclusions, let's just use generateSalariesData
                if (function_exists('generateSalariesData')) {
                    $salaries = generateSalariesData($sqlite, $m, $companyKey, $target_col, $target_val, $serviceKey);
                    foreach ($salaries as $s) {
                        $totalMasse += (float) ($s['total'] ?? $s['base'] ?? 0);
                    }
                } else {
                    echo "generateSalariesData not found";
                    exit;
                }
            }
            
            $results[] = ['period' => $m, 'total' => $totalMasse];
        }
        $out = json_encode(['success' => true, 'history' => $results]);
        ob_end_clean();
        echo $out;
