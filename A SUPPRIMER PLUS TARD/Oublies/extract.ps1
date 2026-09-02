$lines = Get-Content 'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx'
$startIdx = -1
$endIdx = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "\{siteData\.length > 0 && showKPICards && activeSiteId !== 'site_administration' && \(") {
        $startIdx = $i
        break
    }
}

if ($startIdx -ge 0) {
    for ($i = $startIdx; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "\}\)\(\)\}") {
            for ($j = $i; $j -lt $lines.Count; $j++) {
                if ($lines[$j] -match "\)\}") {
                    $endIdx = $j
                    break
                }
            }
            break
        }
    }
}

if ($startIdx -ge 0 -and $endIdx -ge 0) {
    # Extract KPI block
    $kpiBlock = $lines[($startIdx + 1)..($endIdx - 1)]

    # Generate DashboardKPI.jsx
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
    Write-Output "Created DashboardKPI.jsx"

    # Replace block in Dashboard.jsx
    $newLines = @()
    if ($startIdx -gt 0) {
        $newLines += $lines[0..($startIdx - 1)]
    }

    $newLines += "      {siteData.length > 0 && showKPICards && activeSiteId !== 'site_administration' && ("
    $newLines += "        <DashboardKPI"
    $newLines += "          selectedKpiAgent={selectedKpiAgent}"
    $newLines += "          setSelectedKpiAgent={setSelectedKpiAgent}"
    $newLines += "          isScrolled={isScrolled}"
    $newLines += "          handleKpiMouseDown={handleKpiMouseDown}"
    $newLines += "          kpiPos={kpiPos}"
    $newLines += "          setKpiPos={setKpiPos}"
    $newLines += "          isDraggingKpi={isDraggingKpi}"
    $newLines += "          salaryGrid={salaryGrid}"
    $newLines += "          datesList={datesList}"
    $newLines += "        />"
    $newLines += "      )}"

    if ($endIdx -lt ($lines.Count - 1)) {
        $newLines += $lines[($endIdx + 1)..($lines.Count - 1)]
    }

    # Add import if missing
    $importLine = "import DashboardKPI from './ui/DashboardKPI';"
    $hasImport = $false
    for ($i = 0; $i -lt 50; $i++) {
        if ($newLines[$i] -match "import DashboardKPI") {
            $hasImport = $true
            break
        }
    }

    if (-not $hasImport) {
        for ($i = 0; $i -lt $newLines.Count; $i++) {
            if ($newLines[$i] -match "import ") {
                $newLines = $newLines[0..($i - 1)] + @($importLine) + $newLines[$i..($newLines.Count - 1)]
                break
            }
        }
    }

    Set-Content 'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx' -Value $newLines
    Write-Output "Updated Dashboard.jsx"
} else {
    Write-Output "Could not find start or end index."
}
