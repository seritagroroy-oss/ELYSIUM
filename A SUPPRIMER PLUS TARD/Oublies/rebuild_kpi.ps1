$lines = Get-Content 'c:\laragon\www\pontage\sauvegard\Dashboard_5.jsx'
$kpiBlock = $lines[687..1124]

$kpiComponent = @"
import React from 'react';

export default function DashboardKPI({
  selectedKpiAgent,
  setSelectedKpiAgent,
  isScrolled,
  handleKpiMouseDown,
  kpiPos,
  setKpiPos,
  isDraggingKpi,
  salaryGrid,
  datesList
}) {
  if (!selectedKpiAgent) return null;

  return (
"@
$kpiComponent += [Environment]::NewLine + ($kpiBlock -join [Environment]::NewLine)
$kpiComponent += [Environment]::NewLine + @"
  );
}
"@

Set-Content 'c:\laragon\www\pontage\frontend\src\components\ui\DashboardKPI.jsx' -Value $kpiComponent
Write-Output "Successfully rebuilt DashboardKPI.jsx!"
