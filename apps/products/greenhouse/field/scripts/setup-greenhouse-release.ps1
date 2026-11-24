# Everything the Greenhouse field app needs before its first release, in one
# run on your own machine:
#
#   1. a release signing key, with a password made for you, stored as the four
#      GitHub secrets the "Field app release" workflow reads;
#   2. the hosted Supabase project's publishable key, written into both apps'
#      environment.hosted.ts (it is public by design; the secret key is never
#      read).
#
#   powershell -ExecutionPolicy Bypass -File apps/products/greenhouse/field/scripts/setup-greenhouse-release.ps1
#
# Safe to run again: it skips whatever is already done. It never prints a
# password or key. Needs keytool (any JDK), gh signed in to GitHub, and npx.

# Windows PowerShell 5.1 turns anything a native tool (keytool, gh, npx)
# prints on stderr into an error when this is 'Stop', even progress lines.
# So native calls are judged by $LASTEXITCODE, and failures `throw`.
$ErrorActionPreference = 'Continue'
$repo = 'AHrichi/hrichi-platform'
$projectRef = 'wxziozlataokzoftcpgb'
$alias = 'greenhouse-field'
$keystore = Join-Path $HOME 'greenhouse-field-release.jks'
$passwordFile = Join-Path $HOME 'greenhouse-field-release-password.txt'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..\..')).Path
$envFiles = @(
  'apps/products/greenhouse/field/src/environments/environment.hosted.ts',
  'apps/products/greenhouse/dashboard/src/environments/environment.hosted.ts'
) | ForEach-Object { Join-Path $root $_ }

function Step([string]$text) { Write-Host "`n== $text" -ForegroundColor Cyan }

foreach ($tool in 'keytool', 'gh', 'npx') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool was not found. Install it and run this again."
  }
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw 'gh is not signed in to GitHub. Run: gh auth login' }

# 1. The release key and the GitHub secrets ---------------------------------

Step 'Release signing key'
$existing = gh secret list --repo $repo --json name | ConvertFrom-Json | ForEach-Object { $_.name }
$needed = 'ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD'
$missing = $needed | Where-Object { $existing -notcontains $_ }

if (-not $missing) {
  Write-Host 'The four signing secrets are already in GitHub. Skipping.'
} else {
  if (Test-Path $keystore) {
    if (-not (Test-Path $passwordFile)) {
      throw "$keystore exists but its password file doesn't. Put the password in $passwordFile and run again."
    }
    Write-Host "Using the existing key at $keystore."
    $password = (Get-Content $passwordFile -Raw -ErrorAction Stop).Trim()
  } else {
    # 32 random letters and digits, made here and never shown.
    $chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $password = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
    Set-Content -Path $passwordFile -Value $password -NoNewline -Encoding ascii -ErrorAction Stop

    $env:GH_RELEASE_KEY_PASSWORD = $password
    try {
      # PKCS12 keystores use one password for the store and the key.
      keytool -genkeypair -noprompt `
        -keystore $keystore -storetype PKCS12 `
        -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
        -dname 'CN=Field log, O=Greenhouse Labor Planner' `
        -storepass:env GH_RELEASE_KEY_PASSWORD -keypass:env GH_RELEASE_KEY_PASSWORD 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw 'keytool could not create the key.' }
    } finally {
      Remove-Item Env:GH_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
    }
    Write-Host "Made the key: $keystore"
  }

  $values = [ordered]@{
    ANDROID_KEYSTORE_BASE64   = [Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore))
    ANDROID_KEYSTORE_PASSWORD = $password
    ANDROID_KEY_ALIAS         = $alias
    ANDROID_KEY_PASSWORD      = $password
  }
  foreach ($name in $values.Keys) {
    $values[$name] | gh secret set $name --repo $repo
    if ($LASTEXITCODE -ne 0) { throw "Could not store $name in GitHub." }
    Write-Host "Stored $name in GitHub."
  }
}

# 2. The publishable key ------------------------------------------------------

Step 'Supabase publishable key'
$placeholder = 'PASTE_THE_PUBLISHABLE_KEY'
$todo = $envFiles | Where-Object { (Get-Content $_ -Raw -ErrorAction Stop) -match $placeholder }
if (-not $todo) {
  Write-Host 'Both apps already have the key. Skipping.'
} else {
  $supabase = @('-y', 'supabase@3.1.0')
  npx @supabase projects list --output-format json *> $null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Sign in to Supabase in the browser window that opens, then come back here.'
    npx @supabase login
    if ($LASTEXITCODE -ne 0) { throw 'Supabase sign-in did not finish.' }
  }
  # Without --reveal the CLI masks secret keys, so only public ones come back.
  $json = npx @supabase projects api-keys --remote=$projectRef --output-format json 2> $null
  if ($LASTEXITCODE -ne 0) { throw 'Could not list the project''s API keys.' }
  $match = [regex]::Match(($json -join "`n"), 'sb_publishable_[A-Za-z0-9_-]+')
  if (-not $match.Success) { throw 'The project has no publishable key. Create one under Settings > API Keys.' }
  foreach ($file in $todo) {
    $text = (Get-Content $file -Raw -ErrorAction Stop).Replace($placeholder, $match.Value)
    [IO.File]::WriteAllText($file, $text)
    Write-Host "Wrote the key into $file"
  }
}

Step 'Done'
Write-Host "Back up these two files somewhere safe, not in the repo:"
Write-Host "  $keystore"
Write-Host "  $passwordFile"
Write-Host 'Phones only accept updates signed with this key.'
Write-Host 'Then tell Claude it ran, so it can commit the key and start the first release.'
