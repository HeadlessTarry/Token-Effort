param(
    [switch]$Local,
    [string]$Skill,
    [string]$Agent,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host @"
Usage: install.ps1 [-Local] [-Skill <name>] [-Agent <name>]

Options:
  -Local         Install to .opencode/ instead of `$env:USERPROFILE\.config\opencode\
  -Skill <name>  Install only the specified skill
  -Agent <name>  Install only the specified agent
  -Help          Show this help message

If no -Skill or -Agent is specified, all skills and agents are installed.
"@
    exit 0
}

# Defaults
$ScriptDir = $PSScriptRoot
if (-not $Local) {
    $Dest = Join-Path $env:USERPROFILE ".config\opencode"
}
else {
    $Dest = Join-Path (Get-Location).Path ".opencode"
}

# Validate mutually exclusive flags
if ($Skill -and $Agent) {
    Write-Error "-Skill and -Agent are mutually exclusive"
    exit 1
}

# Validate skill name
if ($Skill) {
    if ($Skill -match '\.\.|[/\\]') {
        Write-Error "Invalid skill name: $Skill"
        exit 1
    }
}

# Validate agent name
if ($Agent) {
    if ($Agent -match '\.\.|[/\\]') {
        Write-Error "Invalid agent name: $Agent"
        exit 1
    }
}

# Check prerequisites
if (-not (Get-Command jq -ErrorAction SilentlyContinue)) {
    Write-Error "jq is not installed."
    Write-Error "Install jq: https://jqlang.github.io/jq/download/"
    exit 1
}

# Create destination directories
New-Item -ItemType Directory -Force -Path (Join-Path $Dest "skills") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Dest "agents") | Out-Null

if ($Skill) {
    $SourceDir = Join-Path $ScriptDir "skills\$Skill"
    if (Test-Path $SourceDir -PathType Container) {
        Copy-Item -Recurse -Force -Path "$SourceDir\*" -Destination (Join-Path $Dest "skills\$Skill")
        Write-Host "  Synced skills/$Skill -> $(Join-Path $Dest "skills\$Skill")"
    }
    else {
        Write-Error "Skill not found: $Skill"
        exit 1
    }
}
elseif ($Agent) {
    $SourceFile = Join-Path $ScriptDir "agents\$Agent.md"
    if (Test-Path $SourceFile -PathType Leaf) {
        Copy-Item -Force -Path $SourceFile -Destination (Join-Path $Dest "agents")
        Write-Host "  Synced agents/$Agent.md -> $(Join-Path $Dest "agents\$Agent.md")"
    }
    else {
        Write-Error "Agent not found: $Agent"
        exit 1
    }
}
else {
    foreach ($DirName in @("skills", "agents")) {
        $SourceDir = Join-Path $ScriptDir $DirName
        if (Test-Path $SourceDir -PathType Container) {
            $Items = Get-ChildItem -Path $SourceDir -Force
            # Filter out .gitkeep
            $Items = $Items | Where-Object { $_.Name -ne ".gitkeep" }
            if ($Items.Count -gt 0) {
                foreach ($Item in $Items) {
                    $TargetPath = Join-Path $Dest "$DirName\$($Item.Name)"
                    if ($Item.PSIsContainer) {
                        New-Item -ItemType Directory -Force -Path $TargetPath | Out-Null
                        Copy-Item -Recurse -Force -Path "$($Item.FullName)\*" -Destination $TargetPath
                    }
                    else {
                        Copy-Item -Force -Path $Item.FullName -Destination $TargetPath
                    }
                }
                Write-Host "  Synced $DirName/ -> $(Join-Path $Dest $DirName)"
            }
            else {
                Write-Host "  Skipping $DirName/ — empty"
            }
        }
    }
}

Write-Host "Done. Restart OpenCode to pick up changes."
