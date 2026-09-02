<?php
try {
    $dsn = "mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8mb4";
    $db = new PDO($dsn, "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $periodToUnpublish = "2026-08";
    
    // 1. Chercher TOUS les published_periods contenant 2026-08
    $stmt = $db->query("SELECT service_id, data_value FROM service_data WHERE data_key = 'published_periods'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $svc = $row['service_id'];
        $val = $row['data_value'];
        $arr = json_decode($val, true);
        if (is_array($arr) && in_array($periodToUnpublish, $arr)) {
            $arr = array_values(array_filter($arr, function($p) use ($periodToUnpublish) { return $p !== $periodToUnpublish; }));
            $upd = $db->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'published_periods'");
            $upd->execute([json_encode($arr), $svc]);
            echo "Nettoyé service_data pour : $svc<br/>";
        }
    }
    
    // 2. Supprimer TOUS les payroll_snapshots pour 2026-08
    $snap = $db->prepare("DELETE FROM payroll_snapshots WHERE period = ?");
    $snap->execute([$periodToUnpublish]);
    echo "Snapshots supprimés : " . $snap->rowCount() . "<br/>";
    
    // 3. Supprimer TOUS les payroll_statuses pour 2026-08
    $stat = $db->prepare("DELETE FROM payroll_statuses WHERE period = ?");
    $stat->execute([$periodToUnpublish]);
    echo "Statuts supprimés : " . $stat->rowCount() . "<br/>";
    
    echo "TERMINÉ !";
} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}

