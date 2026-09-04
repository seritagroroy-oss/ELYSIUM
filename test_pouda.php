<?php
session_start();
$_SERVER["REQUEST_METHOD"] = "POST";
$_SESSION["company_id"] = "comp_default_1";
$_SESSION["user_id"] = 1;
require_once __DIR__ . "/backend/database.php";
require_once __DIR__ . "/backend/core/functions.php";

$sqlite = getDb();
try {
    $res = generateSalariesData($sqlite, "comp_default_1", "2026-08", null, false, true);
} catch (Exception $e) {}

$pdo = getElysiumPdo();
$stmt = $pdo->prepare("SELECT id FROM sites WHERE company_id = ?");
$stmt->execute(["comp_default_1"]);
$sites = $stmt->fetchAll();

foreach ($sites as $site) {
    $res = generateSalariesData($sqlite, "comp_default_1", "2026-08", $site["id"], false, true);
    foreach ($res["salaries"] as $sal) {
        if (strpos($sal["name"], "POUDA") !== false) {
            echo "POUDA: Jours Trav: " . $sal["days_worked"] . ", Absences: " . $sal["absences"] . "\n";
            break 2;
        }
    }
}
?>
