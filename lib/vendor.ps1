# Vendor repo management helpers (PowerShell)

function Get-VendorManifest {
    param([string]$ManifestPath)

    if (-not (Test-Path $ManifestPath)) {
        Write-Error "vendor manifest not found: $ManifestPath"
        return @()
    }

    $manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    $vendors = @()

    foreach ($plugin in $manifest.plugins) {
        $vendors += [PSCustomObject]@{
            Type               = "plugin"
            Name               = $plugin.name
            Repo               = $plugin.repo
            OpencodePluginSpec = $plugin.opencode_plugin_spec
            ExtractSkills      = @()
        }
    }

    foreach ($skill in $manifest.skills) {
        $vendors += [PSCustomObject]@{
            Type               = "skill"
            Name               = $skill.name
            Repo               = $skill.repo
            OpencodePluginSpec = ""
            ExtractSkills      = @($skill.extract_skills)
        }
    }

    return $vendors
}

function Invoke-VendorCloneOrUpdate {
    param(
        [string]$VendorDir,
        [string]$Name,
        [string]$RepoUrl,
        [bool]$ShouldUpdate
    )

    $Target = Join-Path $VendorDir $Name

    if (-not (Test-Path $Target)) {
        Write-Host "  Cloning $Name -> $Target"
        try {
            git clone --depth 1 $RepoUrl $Target 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to clone vendor '$Name'"
                return $false
            }
        }
        catch {
            Write-Error "Failed to clone vendor '$Name': $_"
            return $false
        }
    }
    elseif ($ShouldUpdate) {
        Write-Host "  Updating $Name"
        try {
            git -C $Target pull 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to update vendor '$Name'"
                return $false
            }
        }
        catch {
            Write-Error "Failed to update vendor '$Name': $_"
            return $false
        }
    }
    else {
        Write-Host "  Vendor '$Name' already cloned (use -Update to pull latest)"
    }

    return $true
}
