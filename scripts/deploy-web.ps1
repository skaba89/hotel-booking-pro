<#
.SYNOPSIS
  Build + patch + deploy du frontend Next.js vers Netlify (Windows).

.DESCRIPTION
  Encode la procedure de deploiement complete pour eviter les erreurs manuelles :

    1. `netlify build`  -> genere les artefacts dans apps/web/.netlify
    2. PATCH des chemins : sur Windows, le handler serverless genere contient des
       chemins avec des antislashs (`\var\task\apps\web\...`). Au runtime Linux,
       `\v` `\t` etc. sont interpretes comme des sequences d'echappement et
       cassent la resolution de module -> "Internal Error" 500 en production.
       On reecrit chaque litteral contenant `var\task` en forward-slashes, dans :
         - le fichier source .mjs
         - la COPIE du .mjs a l'interieur du .zip (sinon le zip prime)
    3. `netlify deploy --prod --skip-functions-cache`
       Le flag --skip-functions-cache est OBLIGATOIRE : sans lui, Netlify
       redeploie une fonction MISE EN CACHE (donc non patchee, corrompue).

.NOTES
  A lancer depuis n'importe ou : le script se replace a la racine du repo.
  Necessite d'etre deja connecte a Netlify (`netlify login`) et lie au site.
#>

$ErrorActionPreference = 'Stop'

# --- Localisation des chemins -------------------------------------------------
$repoRoot   = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$netlifyDir = Join-Path $repoRoot 'apps\web\.netlify'
$mjsSource  = Join-Path $netlifyDir 'functions-internal\___netlify-server-handler\___netlify-server-handler.mjs'
$zipPath    = Join-Path $netlifyDir 'functions\___netlify-server-handler.zip'
$staticDir  = Join-Path $netlifyDir 'static'
$entryName  = '___netlify-server-handler.mjs'

Push-Location $repoRoot
try {
    # --- 1. Build -------------------------------------------------------------
    Write-Host "==> [1/4] netlify build (@hotel-booking/web)..." -ForegroundColor Cyan
    npx netlify build --filter '@hotel-booking/web'
    if ($LASTEXITCODE -ne 0) { throw "netlify build a echoue (code $LASTEXITCODE)." }

    if (-not (Test-Path $mjsSource)) { throw "Handler introuvable apres build : $mjsSource" }
    if (-not (Test-Path $zipPath))   { throw "Zip de fonction introuvable : $zipPath" }
    if (-not (Test-Path $staticDir)) { throw "Dossier static introuvable : $staticDir" }

    # --- Fonction de patch ----------------------------------------------------
    # Remplace les antislashs par des slashs dans chaque litteral de chaine
    # ('...') contenant `var\task`. Chirurgical : ne touche a rien d'autre.
    function Repair-HandlerPaths([string]$text) {
        $rx = [regex]"'[^']*var\\task[^']*'"
        return $rx.Replace($text, { param($m) $m.Value -replace '\\','/' })
    }

    # Encodage UTF-8 SANS BOM (un BOM en tete de .mjs casserait l'import ESM).
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

    # --- 2a. Patch du .mjs source --------------------------------------------
    Write-Host "==> [2/4] Patch du handler source..." -ForegroundColor Cyan
    $src = [System.IO.File]::ReadAllText($mjsSource)
    $srcPatched = Repair-HandlerPaths $src
    [System.IO.File]::WriteAllText($mjsSource, $srcPatched, $utf8NoBom)

    # --- 2b. Patch du .mjs dans le ZIP ---------------------------------------
    Write-Host "==> [3/4] Patch du handler dans le zip..." -ForegroundColor Cyan
    Add-Type -AssemblyName System.IO.Compression | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

    $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Update)
    try {
        $entry = $zip.Entries | Where-Object { $_.FullName -eq $entryName }
        if ($null -eq $entry) { throw "Entree '$entryName' absente du zip." }

        $reader  = New-Object System.IO.StreamReader($entry.Open())
        $zipText = $reader.ReadToEnd()
        $reader.Close()

        $zipPatched = Repair-HandlerPaths $zipText

        $stream = $entry.Open()
        $stream.SetLength(0)
        $writer = New-Object System.IO.StreamWriter($stream, $utf8NoBom)
        $writer.Write($zipPatched)
        $writer.Flush()
        $writer.Close()
        $stream.Close()
    }
    finally {
        $zip.Dispose()
    }

    # --- Verification : plus aucun `var\task` (antislash) ne doit subsister ---
    if ($srcPatched -match 'var\\task') {
        throw "Patch incomplet : des antislashs subsistent dans le .mjs source."
    }
    Write-Host "    Patch OK (chemins en forward-slash, sans BOM)." -ForegroundColor Green

    # --- 3. Deploiement -------------------------------------------------------
    Write-Host "==> [4/4] netlify deploy --prod --skip-functions-cache..." -ForegroundColor Cyan
    npx netlify deploy --prod --no-build --skip-functions-cache --filter '@hotel-booking/web' --dir "$staticDir"
    if ($LASTEXITCODE -ne 0) { throw "netlify deploy a echoue (code $LASTEXITCODE)." }

    Write-Host "`n[OK] Deploiement termine." -ForegroundColor Green
    Write-Host "     Verifie : https://hotel-setifana-conakry.netlify.app" -ForegroundColor Green
}
finally {
    Pop-Location
}
