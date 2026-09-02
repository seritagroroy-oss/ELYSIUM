$lines = Get-Content 'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx'
$newLines = @()

# Copy lines 0 to 685 (inclusive)
$newLines += $lines[0..685]

# Add new component invocation
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

# Copy the rest of the lines starting from line 1127 (which is the empty line before loading)
$newLines += $lines[1127..($lines.Count - 1)]

# Add the import statement if it doesn't exist
$hasImport = $false
foreach ($line in $newLines) {
    if ($line -match "import DashboardKPI") {
        $hasImport = $true
        break
    }
}

if (-not $hasImport) {
    for ($i = 0; $i -lt $newLines.Count; $i++) {
        if ($newLines[$i] -match "^import ") {
            $newLines = $newLines[0..($i-1)] + @("import DashboardKPI from './ui/DashboardKPI';") + $newLines[$i..($newLines.Count - 1)]
            break
        }
    }
}

Set-Content 'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx' -Value $newLines
Write-Output "Successfully updated Dashboard.jsx with precise lines!"
