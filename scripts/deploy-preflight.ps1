#requires -Version 7.0
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$ExpectedDeploymentId,
  [string[]]$AllowedChangedPath = @()
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$teamId = 'team_TjH2iw1KST0NuoB2oW99e0kR'
$projectId = 'prj_8EgxHw6n4OsZxaabUnypxcQpeYQ5'
$previousNodeOptions = $env:NODE_OPTIONS

function Read-VercelJson([string[]]$Arguments) {
  $output = & vercel @Arguments
  if ($LASTEXITCODE -ne 0) { throw 'Falha na leitura da Vercel. Confira o login e a rede.' }
  return ($output | ConvertFrom-Json)
}

function Expand-SourceTree($Items, [string]$Prefix = '') {
  foreach ($item in $Items) {
    $path = if ($Prefix) { "$Prefix/$($item.name)" } else { $item.name }
    if ($item.type -eq 'directory') { Expand-SourceTree $item.children $path }
    elseif ($item.type -eq 'file') { [pscustomobject]@{ path = $path; hash = $item.uid } }
  }
}

function Get-Sha1([byte[]]$Bytes) {
  return [Convert]::ToHexString([Security.Cryptography.SHA1]::HashData($Bytes)).ToLowerInvariant()
}

Push-Location $repoRoot
try {
  $env:NODE_OPTIONS = (($previousNodeOptions + ' --use-system-ca').Trim())
  & git -c "safe.directory=$($repoRoot.Replace('\', '/'))" -c http.sslBackend=schannel ls-remote --exit-code origin refs/heads/main *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível validar o acesso de leitura ao repositório GitHub.' }
  $active = Read-VercelJson @('inspect', 'https://mobimb.com.br', '--json', '--scope', 'rafapeck10-9742s-projects')
  if ($active.id -ne $ExpectedDeploymentId) {
    throw 'A produção mudou desde a conferência. Compare a nova versão antes de publicar.'
  }
  $deployment = Read-VercelJson @('api', "/v13/deployments/$ExpectedDeploymentId`?teamId=$teamId", '--raw')
  if ($deployment.projectId -ne $projectId) { throw 'O deployment pertence a outro projeto.' }
  # Git-backed deployments do not expose a Vercel source file tree. Use their
  # Git source SHA below; deployments without one must provide the Vercel tree.
  $tree = if ($deployment.gitSource.sha) {
    @()
  } else {
    Read-VercelJson @('api', "/v6/deployments/$ExpectedDeploymentId/files?teamId=$teamId", '--raw')
  }
  $source = @($tree | Where-Object name -eq 'src')
  if ($source.Count -ne 1) {
    if (-not $deployment.gitSource.sha) { throw 'Fonte não disponível: não presumir que o GitHub é igual à produção.' }
    $changed = @(& git -c "safe.directory=$($repoRoot.Replace('\', '/'))" diff --name-only $deployment.gitSource.sha -- src public package.json package-lock.json bun.lock vite.config.ts tsconfig.json vercel.json scripts)
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível comparar o commit de produção.' }
  } else {
    $files = @(Expand-SourceTree $source[0].children)
    $changed = @()
    foreach ($file in $files) {
      $path = [IO.Path]::GetFullPath((Join-Path $repoRoot $file.path))
      if (-not $path.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Caminho inválido na árvore da fonte.'
      }
      if (-not (Test-Path -LiteralPath $path)) { $changed += $file.path; continue }
      $bytes = [IO.File]::ReadAllBytes($path)
      if ((Get-Sha1 $bytes) -eq $file.hash) { continue }
      $lf = [Text.Encoding]::UTF8.GetString($bytes).Replace("`r`n", "`n")
      $hashes = @((Get-Sha1 ([Text.Encoding]::UTF8.GetBytes($lf))), (Get-Sha1 ([Text.Encoding]::UTF8.GetBytes($lf.Replace("`n", "`r`n")))))
      if ($file.hash -notin $hashes) { $changed += $file.path }
    }
    $localFiles = @(Get-ChildItem -LiteralPath 'src', 'public' -File -Recurse | ForEach-Object { $_.FullName.Substring($repoRoot.Length + 1).Replace('\', '/') })
    $changed += @($localFiles | Where-Object { $_ -notin $files.path })
    if ((Test-Path -LiteralPath 'vercel.json') -and 'vercel.json' -notin $files.path) { $changed += 'vercel.json' }
  }
  $unexpected = @($changed | Sort-Object -Unique | Where-Object { $_ -notin $AllowedChangedPath })
  if ($unexpected.Count) { throw ('Arquivos diferentes da produção fora do escopo: ' + ($unexpected -join ', ')) }
  Write-Output ('[OK] Projeto, equipe e fonte conferidos. Diferenças permitidas: ' + (($changed | Sort-Object -Unique) -join ', '))
} finally {
  $env:NODE_OPTIONS = $previousNodeOptions
  Pop-Location
}
