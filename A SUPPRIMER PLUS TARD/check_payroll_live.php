<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = 'payroll_2026-07'");
$stmt->execute();
$row = $stmt->fetch();
$data = json_decode($row['data'], true);

foreach ($data['salaries'] as $s) {
    if (strpos($s['name'], 'FAUSTIN') !== false) {
        echo "Found Faustin: " . $s['name'] . "<br>";
    }
    if ($s['id'] === '6a42ac5e2b98f' || strpos($s['name'], 'ZIE DJIBRIL') !== false) {
        echo "Found Arthur! Perms: " . $s['permission_count'] . "<br>";
        echo "Arthur Net: " . $s['computedNet'] . "<br>";
        echo "Arthur Gross: " . $s['computedBrut'] . "<br>";
        echo "Arthur Retenues: " . $s['retenues'] . "<br>";
    }
}
