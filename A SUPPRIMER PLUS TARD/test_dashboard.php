<?php
require "backend/database.php";
session_start();
$_SESSION["company_id"] = "comp_66a9f4fb0bc2b";
$_SESSION["service_id"] = "svc_1782477157_571";
session_write_close();
$res = file_get_contents("http://localhost/pontage/api_new.php?action=get_dashboard_init&period=2026-08", false, stream_context_create(["http"=>["header"=>"Cookie: PHPSESSID=".session_id()]]));
echo $res;

