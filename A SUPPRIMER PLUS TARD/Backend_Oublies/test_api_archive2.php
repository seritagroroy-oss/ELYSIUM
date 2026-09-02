<?php
$url = 'http://localhost/pontage/backend/api.php?action=get_pointage_for_archive&period=2026-07';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Add fake session cookie or disable auth?
// api.php has auth check: if (!isset($_SESSION['company_id'])) { die json_encode(...) }
curl_close($ch);
