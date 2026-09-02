<?php
$file = 'c:/laragon/www/pontage/backend/modules/salaries.php';
$content = file_get_contents($file);
$lines = explode("\n", $content);

$last_prepare = "";
$last_prepare_line = 0;
$prepare_param_count = 0;

for ($i = 0; $i < count($lines); $i++) {
    $line = trim($lines[$i]);
    
    if (preg_match('/->prepare\(\s*["\'](.*?)(["\']\s*\))/', $line, $matches) || preg_match('/->prepare\(\s*["\'](.*?)["\']/i', $line, $matches)) {
        $last_prepare = $matches[1];
        $last_prepare_line = $i + 1;
        $prepare_param_count = substr_count($last_prepare, '?');
    }
    
    if (preg_match('/->execute\(\[(.*?)\]\)/', $line, $matches)) {
        $execute_args = $matches[1];
        $execute_param_count = 0;
        if (trim($execute_args) !== "") {
            $execute_param_count = substr_count($execute_args, ',') + 1;
        }
        
        if ($prepare_param_count !== $execute_param_count) {
            echo "Mismatch at line " . ($i + 1) . " (prepare at line $last_prepare_line):\n";
            echo "Prepare ($prepare_param_count params): $last_prepare\n";
            echo "Execute ($execute_param_count params): " . $line . "\n";
            echo "--------------------------------------------------------\n";
        }
    }
}
