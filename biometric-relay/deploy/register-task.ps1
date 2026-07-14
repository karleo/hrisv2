param(
    [Parameter(Mandatory = $true)]
    [string]$RelayPath,

    [Parameter(Mandatory = $true)]
    [string]$PhpPath,

    [string]$TaskName = "HRIS Biometric Relay",

    [int]$IntervalMinutes = 2
)

$RelayPath = (Resolve-Path $RelayPath).Path
$PhpPath = (Resolve-Path $PhpPath).Path
$Artisan = Join-Path $RelayPath "artisan"

if (-not (Test-Path $Artisan)) {
    throw "artisan not found at $Artisan"
}

$action = New-ScheduledTaskAction -Execute $PhpPath -Argument "artisan relay:run" -WorkingDirectory $RelayPath
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration ([TimeSpan]::MaxValue)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Registered task '$TaskName' every $IntervalMinutes minute(s)."
Write-Host "  PHP: $PhpPath"
Write-Host "  Dir: $RelayPath"
