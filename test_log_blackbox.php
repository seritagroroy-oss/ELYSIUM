<?php
require __DIR__ . '/backend/database.php';
$_SESSION['username'] = 'TestUser';
$res = logBlackBox(getDb(), 'comp_bb90668e', 'svc_45a046d6', '2026-09', 'DELETE_AGENT', 'Agent: Test');
var_dump($res);
