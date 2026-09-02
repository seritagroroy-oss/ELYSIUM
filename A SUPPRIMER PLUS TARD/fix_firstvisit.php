<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($filePath);

$startIdx = 4552 - 1;
$endIdx = 4565 - 1;

$replacement = [
    "        {/* Modal Première Connexion */}\n",
    "        <FirstVisitModal\n",
    "          showFirstVisitModal={showFirstVisitModal}\n",
    "          period={period}\n",
    "          getSafePeriod={getSafePeriod}\n",
    "          handleFirstVisitNon={handleFirstVisitNon}\n",
    "          handleFirstVisitOui={handleFirstVisitOui}\n",
    "        />\n"
];

array_splice($lines, $startIdx, $endIdx - $startIdx + 1, $replacement);
file_put_contents($filePath, implode("", $lines));
echo "Successfully fixed FirstVisitModal!";
?>
