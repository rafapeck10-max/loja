#requires -Version 5.1
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$expectedProjectId = "prj_8EgxHw6n4OsZxaabUnypxcQpeYQ5"
$expectedTeamId = "team_TjH2iw1KST0NuoB2oW99e0kR"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Assert-CommandSuccess {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$Recovery
    )

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "$Name CLI not found. $Recovery"
    }

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $null = & $Command @Arguments 2>&1
    $commandExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousPreference

    if ($commandExitCode -ne 0) {
        throw "$Name preflight failed. $Recovery"
    }
}

try {
    Assert-CommandSuccess `
        -Name "GitHub" `
        -Command "gh" `
        -Arguments @("auth", "status", "--hostname", "github.com") `
        -Recovery "Run 'gh auth login --hostname github.com --web' and retry."

    Assert-CommandSuccess `
        -Name "Vercel" `
        -Command "vercel" `
        -Arguments @("whoami") `
        -Recovery "Run 'vercel login' in a browser and retry; if this is a network error, validate outside the sandbox before changing system settings."

    $projectLinkPath = Join-Path (Join-Path $repoRoot ".vercel") "project.json"
    if (-not (Test-Path -LiteralPath $projectLinkPath)) {
        throw "This checkout is not linked to Vercel. Run 'vercel link', select project 'loja' in the expected team, and retry."
    }

    $projectLink = Get-Content -LiteralPath $projectLinkPath -Raw | ConvertFrom-Json
    if (($projectLink.projectId -ne $expectedProjectId) -or ($projectLink.orgId -ne $expectedTeamId)) {
        throw "Vercel project/team mismatch. Stop and link this checkout to the confirmed 'loja' project and team."
    }

    Write-Output "[OK] GitHub and Vercel access are available; project 'loja' and its team match the confirmed IDs."
    exit 0
}
catch {
    Write-Error "[BLOCKED] $($_.Exception.Message)"
    exit 1
}
