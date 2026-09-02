<?php
$source = __DIR__ . '/rapports/Dashboard.jsx';
$dest = __DIR__ . '/frontend/src/components/Dashboard.jsx';
copy($source, $dest);

$content = file_get_contents($dest);

// 1. Import
$content = preg_replace("/import ReleveScheduleModal from '\.\/modals\/ReleveScheduleModal';/", "import ReleveScheduleModal from './modals/ReleveScheduleModal';\nimport ClosedMonthModal from './modals/ClosedMonthModal';", $content, 1);

// 2. State
$content = preg_replace("/const \[extraAgents,\s*setExtraAgents\] = useState\(\[\]\);/", "const [extraAgents, setExtraAgents] = useState([]);\n  const [showClosedMonthModal, setShowClosedMonthModal] = useState(false);", $content, 1);

// 3. MAP Validation
$content = preg_replace("/if \(mapStartDate > mapEndDate\) \{\s*alert\('La date de début doit être avant la date de fin\.'\);\s*return;\s*\}/", "if (mapStartDate > mapEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }\n    const mapEndPeriod = mapEndDate.substring(0, 7);\n    if (mapEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }", $content, 1);

// 4. Permission Validation
$content = preg_replace("/if \(permissionStartDate > permissionEndDate\) \{\s*alert\('La date de début doit être avant la date de fin\.'\);\s*return;\s*\}/", "if (permissionStartDate > permissionEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }\n    const permEndPeriod = permissionEndDate.substring(0, 7);\n    if (permEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }", $content, 1);

// 5. CP Validation
$content = preg_replace("/if \(!cpStartDate \|\| !cpEndDate\) \{\s*alert\('Veuillez sélectionner les dates de début et de fin du congé\.'\);\s*return;\s*\}/", "if (!cpStartDate || !cpEndDate) {\n      alert('Veuillez sélectionner les dates de début et de fin du congé.');\n      return;\n    }\n    const cpEndPeriod = cpEndDate.substring(0, 7);\n    if (cpEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }", $content, 1);

// 6. Entrant Validation
$content = preg_replace("/if \(!entrantAgentId \|\| !entrantDate\) \{\s*alert\('Veuillez sélectionner la date de début\.'\);\s*return;\s*\}/", "if (!entrantAgentId || !entrantDate) {\n      alert('Veuillez sélectionner la date de début.');\n      return;\n    }\n    const entrantEndPeriod = entrantDate.substring(0, 7);\n    if (entrantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }", $content, 1);

// 7. Sortant Validation
$content = preg_replace("/if \(!sortantAgentId \|\| !sortantDate\) \{\s*alert\('Veuillez sélectionner la date\.'\);\s*return;\s*\}/", "if (!sortantAgentId || !sortantDate) {\n      alert('Veuillez sélectionner la date.');\n      return;\n    }\n    const sortantEndPeriod = sortantDate.substring(0, 7);\n    if (sortantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }", $content, 1);

// 8. Modal Render
$content = preg_replace("/\{showTransferModal && \(/", "{showClosedMonthModal && (\n        <ClosedMonthModal \n          onClose={() => setShowClosedMonthModal(false)} \n        />\n      )}\n\n      {showTransferModal && (", $content, 1);

file_put_contents($dest, $content);
echo "SUCCESS!";
?>
