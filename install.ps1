# install.ps1 — создаёт симлинки для настроек Copilot CLI
# Запускать от имени администратора (нужно для создания симлинков на Windows)

$dotfiles = $PSScriptRoot
$copilotDir = "$HOME\.copilot"

# Создать папку .copilot если не существует
if (-not (Test-Path $copilotDir)) {
    New-Item -ItemType Directory -Path $copilotDir | Out-Null
    Write-Host "Создана папка: $copilotDir"
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
        Write-Host "Пропущен (файл не найден): $($links[$target])"
        continue
    }

    # Удалить существующий файл/симлинк
    if (Test-Path $linkPath) {
        Remove-Item $linkPath -Force
    }

    New-Item -ItemType SymbolicLink -Path $linkPath -Target $sourcePath | Out-Null
    Write-Host "Симлинк создан: $linkPath -> $sourcePath"
}

Write-Host "`nГотово! Перезапусти Copilot CLI."
