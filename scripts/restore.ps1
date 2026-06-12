param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$BackupDir = Join-Path (Join-Path $PSScriptRoot "..") "backups"

if (-not $BackupFile) {
    Write-Host "Usage: .\scripts\restore.ps1 -BackupFile <path_to_backup.sql>"
    Write-Host ""
    Write-Host "Available backups:"
    if (Test-Path $BackupDir) {
        Get-ChildItem $BackupDir -Filter "hotel_booking_*.sql" | Sort-Object LastWriteTime -Descending |
            ForEach-Object { Write-Host "  $($_.FullName) ($([math]::Round($_.Length / 1KB, 1)) KB) - $($_.LastWriteTime)" }
    } else {
        Write-Host "  No backups found"
    }
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile"
    exit 1
}

Write-Host "[$(Get-Date)] Restoring from: $BackupFile"
Write-Host "WARNING: This will overwrite the current database. Press Ctrl+C within 5 seconds to cancel."
Start-Sleep -Seconds 5

Get-Content $BackupFile | docker exec -i hotel-booking-postgres psql -U postgres hotel_booking_pro

Write-Host "[$(Get-Date)] Restore complete."
