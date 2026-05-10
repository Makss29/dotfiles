# install.ps1 - Create symlinks for Copilot CLI settings
# Auto-elevates to Administrator if needed

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

$dotfiles = $PSScriptRoot
$copilotDir = "$HOME\.copilot"

if (-not (Test-Path $copilotDir)) {
    New-Item -ItemType Directory -Path $copilotDir | Out-Null
    Write-Host "Created: $copilotDir"
}

$links = @{
    "copilot-instructions.md" = "copilot\copilot-instructions.md"
    "lsp-config.json"         = "copilot\lsp-config.json"
    "settings.json"           = "copilot\settings.json"
}

foreach ($target in $links.Keys) {
    $linkPath   = "$copilotDir\$target"
    $sourcePath = "$dotfiles\$($links[$target])"

    if (-not (Test-Path $sourcePath)) {
        Write-Host "Skipped (not found): $($links[$target])"
        continue
    }

    if (Test-Path $linkPath) {
        Remove-Item $linkPath -Force
    }

    New-Item -ItemType SymbolicLink -Path $linkPath -Target $sourcePath | Out-Null
    Write-Host "Linked: $linkPath"
}

# Install skills — copy each skill folder to ~/.copilot/skills/
$skillsSrc = "$dotfiles\copilot\skills"
$skillsDst = "$copilotDir\skills"

if (Test-Path $skillsSrc) {
    New-Item -ItemType Directory -Path $skillsDst -Force | Out-Null
    foreach ($skill in Get-ChildItem $skillsSrc -Directory) {
        $target = "$skillsDst\$($skill.Name)"
        if (Test-Path $target) { Remove-Item $target -Recurse -Force }
        Copy-Item $skill.FullName $target -Recurse
        Write-Host "Skill installed: $($skill.Name)"
    }
}

Write-Host "`nDone! Restart Copilot CLI."
Read-Host "Press Enter to close"
