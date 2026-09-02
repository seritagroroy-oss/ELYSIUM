<?php
require 'database.php';

$sqlite = getDb();
$company_id = 'comp_default_1';

echo "1. Table supplementaires_externes:\n";
$stmt = $sqlite->prepare("SELECT * FROM supplementaires_externes ORDER BY id DESC LIMIT 10");
$stmt->execute();
$rows = $stmt->fetchAll();
foreach ($rows as $row) {
    echo json_encode($row) . "\n";
}

echo "\n2. Test AAA dans agents:\n";
$stmt2 = $sqlite->prepare("SELECT id, name, `function`, salary FROM agents WHERE LOWER(TRIM(name)) = LOWER(TRIM('AAA'))");
$stmt2->execute();
$aaa = $stmt2->fetchAll();
foreach ($aaa as $row) {
    echo json_encode($row) . "\n";
}

echo "\n3. Test grille salariale:\n";
$stmt3 = $sqlite->prepare("SELECT * FROM salary_grid WHERE company_id = ?");
$stmt3->execute([$company_id]);
$grid = $stmt3->fetchAll();
foreach ($grid as $row) {
    echo json_encode($row) . "\n";
}

echo "\n4. Test functions_raw:\n";
$functionsRawStr = @file_get_contents(__DIR__ . "/data/{$company_id}_functions.json");
if ($functionsRawStr) {
    echo $functionsRawStr . "\n";
}
