<?php
require 'backend/database.php';
$sqlite = getDb();
print_r($sqlite->query("SELECT id, name, archived_period FROM agents WHERE id='6a1e2edbec8b0'"));
