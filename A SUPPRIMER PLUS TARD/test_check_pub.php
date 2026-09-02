<?php require "backend/database.php"; $db = getDb(); $stmt = $db->prepare("SELECT * FROM service_data WHERE data_key = 'published_periods'"); $stmt->execute(); print_r($stmt->fetchAll());
