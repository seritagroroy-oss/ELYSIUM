<?php require "backend/database.php"; $stmt = $pdo->query("SELECT * FROM service_data WHERE data_key = 'published_periods'"); echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
