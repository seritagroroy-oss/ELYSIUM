$text = Get-Content 'c:\laragon\www\pontage\frontend\src\components\Dashboard.jsx' -Raw
$open = 0
$close = 0
foreach ($c in $text.ToCharArray()) {
    if ($c -eq '{') { $open++ }
    elseif ($c -eq '}') { $close++ }
}
Write-Output "Open: $open, Close: $close"

$openP = 0
$closeP = 0
foreach ($c in $text.ToCharArray()) {
    if ($c -eq '(') { $openP++ }
    elseif ($c -eq ')') { $closeP++ }
}
Write-Output "Open Parentheses: $openP, Close: $closeP"

$openDiv = ([regex]::Matches($text, '<div\b[^>]*>')).Count
$closeDiv = ([regex]::Matches($text, '</div>')).Count
Write-Output "Open Divs: $openDiv, Close Divs: $closeDiv"
