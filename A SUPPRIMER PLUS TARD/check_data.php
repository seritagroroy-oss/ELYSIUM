<?php
header('Content-Type: application/json; charset=UTF-8');
$res = [];

// 1. Check MySQL
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $mysql = new PDO($dsn, 'root', '');
    $stmt = $mysql->query("SELECT id, period, company_id FROM archives_pointage");
    $res['mysql'] = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
} catch (Exception $e) {
    $res['mysql_error'] = $e->getMessage();
}

// 2. Check SQLite in backend
try {
    if (file_exists(__DIR__ . '/backend/elysium.db')) {
        $sqlite1 = new SQLite3(__DIR__ . '/backend/elysium.db');
        $res1 = @$sqlite1->query("SELECT id, period, company_id FROM archives_pointage");
        $data1 = [];
        if ($res1) {
            while ($row = $res1->fetchArray(SQLITE3_ASSOC)) {
                $data1[] = $row;
            }
        } else {
            $data1 = 'Table not found or error';
        }
        $res['sqlite_backend'] = $data1;
    } else {
        $res['sqlite_backend'] = 'File not found';
    }
} catch (Exception $e) {
    $res['sqlite_backend_error'] = $e->getMessage();
}

// 3. Check SQLite in root
try {
    if (file_exists(__DIR__ . '/elysium.db')) {
        $sqlite2 = new SQLite3(__DIR__ . '/elysium.db');
        $res2 = @$sqlite2->query("SELECT id, period, company_id FROM archives_pointage");
        $data2 = [];
        if ($res2) {
            while ($row = $res2->fetchArray(SQLITE3_ASSOC)) {
                $data2[] = $row;
            }
        } else {
            $data2 = 'Table not found or error';
        }
        $res['sqlite_root'] = $data2;
    } else {
        $res['sqlite_root'] = 'File not found';
    }
} catch (Exception $e) {
    $res['sqlite_root_error'] = $e->getMessage();
}

die(json_encode($res));
