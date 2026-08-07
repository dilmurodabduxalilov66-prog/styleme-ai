if (Test-Path "services.pids") {
    $pidsContent = Get-Content "services.pids"
    foreach ($line in $pidsContent) {
        if ($line -match "(\w+)=(\d+)") {
            $name = $Matches[1]
            $servicePid = [int]$Matches[2]
            try {
                Stop-Process -Id $servicePid -Force
                Write-Host "Stopped $name service (PID: $servicePid)"
            } catch {
                Write-Host "Failed to stop $name service (PID: $servicePid) or already stopped"
            }
        }
    }
    Remove-Item "services.pids"
} else {
    Write-Host "services.pids file not found."
}
