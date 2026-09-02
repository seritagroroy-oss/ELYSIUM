<?php
$content = file_get_contents('c:\\laragon\\www\\pontage\\frontend\\src\\components\\PayrollView.jsx');
$lines = explode("\n", $content);
$res = [];
foreach($lines as $i => $line) {
  if (strpos($line, 'pontage_return') !== false) {
    $res[] = ($i+1) . ': ' . trim($line);
  }
}
file_put_contents('c:\\laragon\\www\\pontage\\output2.txt', implode("\n", $res));
