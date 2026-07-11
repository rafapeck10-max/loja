$token = $env:GITHUB_TOKEN
if (-not $token) {
    $token = Read-Host -Prompt "Por favor, insira seu GitHub Personal Access Token"
}
if (-not $token) {
    Write-Error "Token do GitHub não fornecido."
    exit 1
}
$headers = @{
    "Authorization" = "token $token"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"    = "PowerShell-Deploy"
}

# Step 0: Verify token
Write-Host "=== Verifying token ==="
$user = Invoke-RestMethod -Method Get -Uri "https://api.github.com/user" -Headers $headers -ErrorAction Stop
Write-Host "Authenticated as: $($user.login)"

# Step 1: Create the repository
Write-Host ""
Write-Host "=== Creating repository 'loja' ==="
$createBody = @{
    name        = "loja"
    description = "Mobili - Loja de moveis de luxo"
    homepage    = "https://rafapeck10-max.github.io/loja/"
    private     = $false
    auto_init   = $true
} | ConvertTo-Json -Depth 4

try {
    $newRepo = Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers $headers -Body $createBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "Repository created: $($newRepo.html_url)"
}
catch {
    Write-Host "Repo already exists or note: $_"
}

Write-Host "Waiting for GitHub to initialize..."
Start-Sleep -Seconds 5

# Step 2: Upload files
$repo = "rafapeck10-max/loja"
$basePath = "c:\Users\rafap\OneDrive\" + [char]0x00C1 + "rea de Trabalho\SITE"
if (-not (Test-Path $basePath)) {
    $basePath = "c:\Users\rafap\OneDrive\Area de Trabalho\SITE"
}
Write-Host "Using base path: $basePath"

$filesToUpload = @(
    "index.html",
    "style.css",
    "script.js",
    "produto_mobili.html",
    "data/products.json"
)

Write-Host ""
Write-Host "=== Uploading files ==="
foreach ($file in $filesToUpload) {
    $fullPath = Join-Path $basePath $file
    if (-not (Test-Path $fullPath)) {
        Write-Host "SKIP: $file not found at $fullPath"
        continue
    }

    Write-Host "Uploading $file ..."
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $apiUrl = "https://api.github.com/repos/$repo/contents/$file"

    $sha = $null
    try {
        $existing = Invoke-RestMethod -Method Get -Uri $apiUrl -Headers $headers -ErrorAction Stop
        $sha = $existing.sha
        Write-Host "  Updating existing file..."
    }
    catch {
        Write-Host "  Creating new file..."
    }

    $bodyObj = @{
        message = "Deploy $file"
        content = $base64
        branch  = "main"
    }
    if ($sha) {
        $bodyObj["sha"] = $sha
    }

    $jsonBody = $bodyObj | ConvertTo-Json -Depth 4

    try {
        Invoke-RestMethod -Method Put -Uri $apiUrl -Headers $headers -Body $jsonBody -ContentType "application/json" -ErrorAction Stop | Out-Null
        Write-Host "  OK: $file uploaded!"
    }
    catch {
        Write-Host "  ERROR: $_"
    }
}

# Step 3: Enable GitHub Pages
Write-Host ""
Write-Host "=== Enabling GitHub Pages ==="
$pagesUrl = "https://api.github.com/repos/$repo/pages"
$pagesBody = @{
    source = @{
        branch = "main"
        path   = "/"
    }
} | ConvertTo-Json -Depth 4

try {
    Invoke-RestMethod -Method Post -Uri $pagesUrl -Headers $headers -Body $pagesBody -ContentType "application/json" -ErrorAction Stop | Out-Null
    Write-Host "GitHub Pages ENABLED!"
}
catch {
    try {
        Invoke-RestMethod -Method Put -Uri $pagesUrl -Headers $headers -Body $pagesBody -ContentType "application/json" -ErrorAction Stop | Out-Null
        Write-Host "GitHub Pages UPDATED!"
    }
    catch {
        Write-Host "Pages note: $_"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "DEPLOY COMPLETO!"
Write-Host "Seu site estara disponivel em:"
Write-Host "https://rafapeck10-max.github.io/loja/"
Write-Host "(pode levar 1-2 minutos para ficar online)"
Write-Host "=========================================="
