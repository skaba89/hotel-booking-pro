$ErrorActionPreference = "Stop"

$BackupDir = Join-Path (Join-Path $PSScriptRoot "..") "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "hotel_booking_${Timestamp}.sql"
$KeepDays = 7

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "[$(Get-Date)] Starting backup..."
docker exec hotel-booking-postgres pg_dump -U postgres hotel_booking_pro > $BackupFile
Write-Host "[$(Get-Date)] Backup saved: $BackupFile ($([math]::Round((Get-Item $BackupFile).Length / 1KB, 1)) KB)"

Write-Host "[$(Get-Date)] Cleaning backups older than $KeepDays days..."
Get-ChildItem $BackupDir -Filter "hotel_booking_*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
    Remove-Item -Force -Confirm:$false

Write-Host "[$(Get-Date)] Backup complete."
