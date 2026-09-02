<?php
$content = file_get_contents("c:/laragon/www/pontage/frontend/src/components/Dashboard.jsx");

$startStr = "{siteData.length > 0 && showKPICards && activeSiteId !== 'site_administration' && (";
$startPos = strpos($content, $startStr);
if ($startPos === false) die("Start not found\n");

$innerMarker = "})()}";
$innerEndPos = strpos($content, $innerMarker, $startPos);
if ($innerEndPos === false) die("Inner end not found\n");

$endPos = strpos($content, ")}", $innerEndPos);
if ($endPos === false) die("End not found\n");
$endPos += 2;

// The block to extract starts after `<div ... style={...}>` 
$kpiStart = strpos($content, "{selectedKpiAgent && (", $startPos);
$kpiBlock = substr($content, $kpiStart, $innerEndPos - $kpiStart);
$kpiBlockClean = trim($kpiBlock);

$kpiComponent = "import React from 'react';\n\n";
$kpiComponent .= "export default function DashboardKPI({\n";
$kpiComponent .= "  selectedKpiAgent,\n";
$kpiComponent .= "  setSelectedKpiAgent,\n";
$kpiComponent .= "  isScrolled,\n";
$kpiComponent .= "  handleKpiMouseDown,\n";
$kpiComponent .= "  kpiPos,\n";
$kpiComponent .= "  setKpiPos,\n";
$kpiComponent .= "  isDraggingKpi,\n";
$kpiComponent .= "  salaryGrid,\n";
$kpiComponent .= "  datesList\n";
$kpiComponent .= "}) {\n";
$kpiComponent .= "  if (!selectedKpiAgent) return null;\n\n";
$kpiComponent .= "  return (\n";
$kpiComponent .= "    <div \n";
$kpiComponent .= "      onMouseDown={selectedKpiAgent && isScrolled ? handleKpiMouseDown : undefined}\n";
$kpiComponent .= "      style={selectedKpiAgent && isScrolled ? { \n";
$kpiComponent .= "        position: 'fixed',\n";
$kpiComponent .= "        bottom: '24px',\n";
$kpiComponent .= "        left: '50%',\n";
$kpiComponent .= "        transform: `translate(calc(-50% + \${kpiPos.x}px), \${kpiPos.y}px)`,\n";
$kpiComponent .= "        width: 'calc(100% - 48px)',\n";
$kpiComponent .= "        maxWidth: '1200px',\n";
$kpiComponent .= "        background: 'rgba(23, 23, 23, 0.85)',\n";
$kpiComponent .= "        backdropFilter: 'blur(16px)',\n";
$kpiComponent .= "        border: '1px solid rgba(255, 255, 255, 0.1)',\n";
$kpiComponent .= "        borderRadius: '16px',\n";
$kpiComponent .= "        padding: '16px',\n";
$kpiComponent .= "        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',\n";
$kpiComponent .= "        zIndex: 100,\n";
$kpiComponent .= "        display: 'grid',\n";
$kpiComponent .= "        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',\n";
$kpiComponent .= "        gap: '12px',\n";
$kpiComponent .= "        cursor: isDraggingKpi ? 'grabbing' : 'grab',\n";
$kpiComponent .= "        transition: isDraggingKpi ? 'none' : 'box-shadow 0.3s ease',\n";
$kpiComponent .= "        animation: 'slideUp 0.3s ease-out'\n";
$kpiComponent .= "      } : {\n";
$kpiComponent .= "        display: 'grid',\n";
$kpiComponent .= "        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',\n";
$kpiComponent .= "        gap: '16px',\n";
$kpiComponent .= "        background: 'rgba(255,255,255,0.02)',\n";
$kpiComponent .= "        padding: '20px',\n";
$kpiComponent .= "        borderRadius: '16px',\n";
$kpiComponent .= "        border: '1px solid rgba(255,255,255,0.05)',\n";
$kpiComponent .= "        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',\n";
$kpiComponent .= "        marginBottom: '24px',\n";
$kpiComponent .= "        position: 'relative',\n";
$kpiComponent .= "        animation: 'fadeIn 0.5s ease-out'\n";
$kpiComponent .= "      }}>\n";
$kpiComponent .= $kpiBlockClean . "\n";
$kpiComponent .= "    </div>\n";
$kpiComponent .= "  );\n}\n";

file_put_contents("c:/laragon/www/pontage/frontend/src/components/ui/DashboardKPI.jsx", $kpiComponent);
echo "DashboardKPI created.\n";

$oldBlock = substr($content, $startPos, $endPos - $startPos);

$newBlock = "{siteData.length > 0 && showKPICards && activeSiteId !== 'site_administration' && (\n";
$newBlock .= "        <DashboardKPI\n";
$newBlock .= "          selectedKpiAgent={selectedKpiAgent}\n";
$newBlock .= "          setSelectedKpiAgent={setSelectedKpiAgent}\n";
$newBlock .= "          isScrolled={isScrolled}\n";
$newBlock .= "          handleKpiMouseDown={handleKpiMouseDown}\n";
$newBlock .= "          kpiPos={kpiPos}\n";
$newBlock .= "          setKpiPos={setKpiPos}\n";
$newBlock .= "          isDraggingKpi={isDraggingKpi}\n";
$newBlock .= "          salaryGrid={salaryGrid}\n";
$newBlock .= "          datesList={datesList}\n";
$newBlock .= "        />\n";
$newBlock .= "      )}";

$content = str_replace($oldBlock, $newBlock, $content);

if (strpos($content, "import DashboardKPI") === false) {
    $importStatement = "import DashboardKPI from './ui/DashboardKPI';\n";
    $firstImportPos = strpos($content, "import ");
    $content = substr_replace($content, $importStatement, $firstImportPos, 0);
}

file_put_contents("c:/laragon/www/pontage/frontend/src/components/Dashboard.jsx", $content);
echo "Dashboard updated.\n";
?>
