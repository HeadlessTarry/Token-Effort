# opencode.json manipulation helpers (PowerShell)

function New-ConfigBackup {
    param([string]$ConfigPath)

    if (-not (Test-Path $ConfigPath)) {
        Write-Host "  No existing config to backup"
        return
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupPath = "$ConfigPath.bak.$timestamp"
    Copy-Item $ConfigPath $backupPath
    Write-Host "  Backup created: $backupPath"
}

function Get-ConfigPlugins {
    param([string]$ConfigPath)

    if (-not (Test-Path $ConfigPath)) {
        # Leading comma prevents PowerShell from unrolling single-element arrays
        return ,@()
    }

    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        if ($config.plugins) {
            return ,@($config.plugins)
        }
        return ,@()
    }
    catch {
        Write-Error "Invalid JSON in $ConfigPath - aborting. Fix the JSON or delete the file to let the installer recreate it."
        return $null
    }
}

function Set-ConfigPlugins {
    param(
        [string]$ConfigPath,
        [string[]]$PluginSpecs
    )

    if ($PluginSpecs.Count -eq 0) {
        return
    }

    # Read current
    $currentPlugins = Get-ConfigPlugins -ConfigPath $ConfigPath
    if ($null -eq $currentPlugins) {
        return  # Invalid JSON - error already written
    }

    # Filter out already-present plugins
    $newSpecs = @()
    foreach ($spec in $PluginSpecs) {
        if ($currentPlugins -contains $spec) {
            Write-Host "  Plugin already present: $spec (skipping)"
        }
        else {
            $newSpecs += $spec
        }
    }

    if ($newSpecs.Count -eq 0) {
        Write-Host "  All plugins already configured - no changes needed"
        return
    }

    # Show what will be added
    Write-Host "  Plugins to add:"
    foreach ($spec in $newSpecs) {
        Write-Host "    + $spec"
    }

    # Backup
    New-ConfigBackup -ConfigPath $ConfigPath

    # Build updated config
    if (Test-Path $ConfigPath) {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    }
    else {
        $config = [PSCustomObject]@{}
    }

    if (-not $config.plugins) {
        $config | Add-Member -NotePropertyName "plugins" -NotePropertyValue @()
    }

    foreach ($spec in $newSpecs) {
        $config.plugins += $spec
    }

    # Write
    $config | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath

    # Validate
    try {
        $null = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    }
    catch {
        Write-Error "Failed to write valid JSON to $ConfigPath"
        return
    }

    Write-Host "  Config updated successfully"
}