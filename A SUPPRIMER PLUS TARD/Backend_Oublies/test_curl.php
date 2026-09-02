<?php
$url = 'http://localhost/pontage/backend/api.php?action=get_pointage_for_archive&period=2026-07';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Cookie: PHPSESSID=' . session_id() // this won't work if no active session
]);
$response = curl_exec($ch);
curl_close($ch);
