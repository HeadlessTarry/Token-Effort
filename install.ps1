param(
    [switch]$Local,
    [string]$Skill,
    [string]$Agent,
    [switch]$Update,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
    Write-Host @"
Usage: install.ps1 [-Local] [-Skill <name>] [-Agent <name>] [-Update]

Options:
  -Local         Install to .opencode/ instead of `$env:USERPROFILE\.config\opencode\
  -Skill <name>  Install only the specified skill
  -Agent <name>  Install only the specified agent
  -Update        Pull latest for each vendor repo
  -Help          Show this help message

If no -Skill or -Agent is specified, all skills and agents are installed.
"@
    exit 0
}

# Defaults
$ScriptDir = $PSScriptRoot
$Dest = if ($Local) {
    Join-Path (Get-Location).Path ".opencode"
}
else {
    Join-Path $env:USERPROFILE ".config\opencode"
}

$ShouldUpdate = [bool]$Update

# Validate mutually exclusive flags
if ($Skill -and $Agent) {
    Write-Error "-Skill and -Agent are mutually exclusive"
    exit 1
}

# Validate skill name
if ($Skill -and ($Skill -match '\.\.|[/\\]')) {
    Write-Error "Invalid skill name: $Skill"
    exit 1
}

# Validate agent name
if ($Agent -and ($Agent -match '\.\.|[/\\]')) {
    Write-Error "Invalid agent name: $Agent"
    exit 1
}

# Check prerequisites
foreach ($cmd in @("jq", "git")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "$cmd is not installed."
        exit 1
    }
}

# Import helpers
. (Join-Path $ScriptDir "lib\vendor.ps1")
. (Join-Path $ScriptDir "lib\config.ps1")

# --- Vendor processing ---

$VendorDir = Join-Path $ScriptDir ".vendor"
$ManifestPath = Join-Path $ScriptDir "vendor.json"
$PluginSpecs = @()

if (Test-Path $ManifestPath) {
    Write-Host "Processing vendor manifest..."

    $vendors = Get-VendorManifest -ManifestPath $ManifestPath

    foreach ($vendor in $vendors) {
        Write-Host ""
        Write-Host "Vendor: $($vendor.Name) ($($vendor.Type))"

        $success = Invoke-VendorCloneOrUpdate -VendorDir $VendorDir -Name $vendor.Name -RepoUrl $vendor.Repo -ShouldUpdate $ShouldUpdate

        if (-not $success) {
            Write-Host "Failed to process vendor '$($vendor.Name)'"
            $choice = Read-Host "Retry? (r)etry / (s)kip / (a)bort"
            switch ($choice) {
                { $_ -match '^[rR]' } {
                    $success = Invoke-VendorCloneOrUpdate -VendorDir $VendorDir -Name $vendor.Name -RepoUrl $vendor.Repo -ShouldUpdate $ShouldUpdate
                    if (-not $success) {
                        Write-Error "Aborting."
                        exit 1
                    }
                }
                { $_ -match '^[sS]' } {
                    Write-Host "  Skipping vendor '$($vendor.Name)'"
                    continue
                }
                default {
                    Write-Error "Aborting."
                    exit 1
                }
            }
        }

        # Queue plugins
        if ($vendor.Type -eq "plugin" -and $vendor.OpencodePluginSpec) {
            $PluginSpecs += $vendor.OpencodePluginSpec
        }

        # Copy vendor skills
        if ($vendor.Type -eq "skill" -and $vendor.ExtractSkills.Count -gt 0) {
            foreach ($skillName in $vendor.ExtractSkills) {
                $sourcePath = Join-Path $VendorDir "$($vendor.Name)\skills\$skillName"
                if (Test-Path $sourcePath -PathType Container) {
                    $destPath = Join-Path $Dest "skills\$skillName"
                    New-Item -ItemType Directory -Force -Path $destPath | Out-Null
                    Copy-Item -Recurse -Force -Path "$sourcePath\*" -Destination $destPath
                    Write-Host "  Copied skill: $skillName"
                }
                else {
                    Write-Host "  Warning: skill '$skillName' not found in vendor '$($vendor.Name)'"
                    $skipChoice = Read-Host "  Skip this skill and continue? (y/n)"
                    if ($skipChoice -notin @("y", "Y")) {
                        Write-Error "Aborting."
                        exit 1
                    }
                }
            }
        }
    }

    # Process plugin queue
    if ($PluginSpecs.Count -gt 0) {
        Write-Host ""
        Write-Host "Updating opencode.json plugins..."

        $configPath = Join-Path $Dest "opencode.json"
        New-Item -ItemType Directory -Force -Path $Dest | Out-Null

        Write-Host "  Proposed changes:"
        foreach ($spec in $PluginSpecs) {
            Write-Host "    + $spec"
        }

        $confirm = Read-Host "  Apply these changes? (y/n)"
        if ($confirm -match '^[yY]') {
            Set-ConfigPlugins -ConfigPath $configPath -PluginSpecs $PluginSpecs
        }
        else {
            Write-Host "  Skipping opencode.json update"
        }
    }
}

# --- Own skills/agents install ---

Write-Host ""
Write-Host "Installing Token-Effort skills and agents..."

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
                Write-Host "  Skipping $DirName/ - empty"
            }
        }
    }
}

Write-Host ""
Write-Host "Done. Restart OpenCode to pick up changes."
