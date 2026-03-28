# branch-diff.ps1 — compute the branch diff relative to its base
# Exit codes: 0 = success, 1 = base branch not detected (ask user), 2 = unexpected error

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([string[]]$GitArgs)
    $output = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        $errMsg = $output | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] } | Out-String
        Write-Error "git $($GitArgs -join ' ') failed: $errMsg"
        exit 2
    }
    return $output | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] }
}

# --- Base branch detection ---

$current = Invoke-Git 'rev-parse', '--abbrev-ref', 'HEAD'
$base = $null

# Step 1: upstream tracking branch — only if it diverges from HEAD
if ($current -ne 'HEAD') {
    $upstream = Invoke-Git 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'
    if ($upstream) {
        $upstreamMergeBase = Invoke-Git 'merge-base', 'HEAD', $upstream
        $headHash = Invoke-Git 'rev-parse', 'HEAD'
        if ($upstreamMergeBase -and ($upstreamMergeBase -ne $headHash)) {
            $base = $upstream
        }
    }
}

# Step 2: remote default branch via cached metadata (no network)
if (-not $base) {
    $remoteInfo = & git remote show origin --no-fetch 2>$null | Select-String 'HEAD branch'
    if ($remoteInfo) {
        $defaultBranch = ($remoteInfo -replace '.*HEAD branch:\s*', '').Trim()
        if ($defaultBranch) {
            $base = "origin/$defaultBranch"
        }
    }
}

# Step 3: probe known default names
if (-not $base) {
    $mainCheck = & git rev-parse --verify origin/main 2>$null
    if ($mainCheck) {
        $base = 'origin/main'
    } else {
        $masterCheck = & git rev-parse --verify origin/master 2>$null
        if ($masterCheck) {
            $base = 'origin/master'
        }
    }
}

# Step 4: give up — caller must ask the user
if (-not $base) {
    Write-Error 'ERROR: Could not detect base branch automatically. Please specify the branch to diff against (e.g. origin/main).'
    exit 1
}

# --- Merge base computation ---

$mergeBase = Invoke-Git 'merge-base', 'HEAD', $base
$headHash = Invoke-Git 'rev-parse', 'HEAD'

Write-Output "BASE=$base"
Write-Output "MERGE_BASE=$mergeBase"

if ($mergeBase -eq $headHash) {
    Write-Output 'STATUS=empty'
    Write-Output "MESSAGE=No commits on this branch relative to $base. Diff is empty."
    exit 0
}

Write-Output 'STATUS=ok'

Write-Output ''
Write-Output '--- CHANGED_FILES ---'
Invoke-Git 'diff', '--name-only', $mergeBase, 'HEAD'

Write-Output ''
Write-Output '--- COMMITS ---'
Invoke-Git 'log', '--oneline', "$mergeBase..HEAD"

Write-Output ''
Write-Output '--- DIFF ---'
$diffOutput = Invoke-Git 'diff', $mergeBase, 'HEAD'
$lineCount = ($diffOutput | Measure-Object -Line).Lines

if ($lineCount -gt 1000) {
    $tmpFile = [System.IO.Path]::GetTempFileName() + '.patch'
    $diffOutput | Set-Content -Path $tmpFile -Encoding UTF8
    Write-Output "LARGE_DIFF_FILE=$tmpFile"
    Write-Output "(Diff is $lineCount lines — written to temp file above)"
} else {
    Write-Output $diffOutput
}
