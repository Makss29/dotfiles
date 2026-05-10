# Dotfiles — настройки GitHub Copilot CLI

Репозиторий с персональными настройками для переноса между компьютерами.

## Структура

```
copilot/
  copilot-instructions.md   # Глобальные инструкции для всех проектов
  lsp-config.json           # Настройки LSP-серверов (если нужны)
  settings.json             # Настройки Copilot CLI (модель, тема и т.д.)
```

## Установка на новом компьютере

```powershell
git clone https://github.com/Mae-Y/dotfiles.git $HOME\dotfiles
cd $HOME\dotfiles
.\install.ps1
```

## Обновление настроек

После изменения файлов в `copilot/`:
```powershell
git add .
git commit -m "update copilot settings"
git push
```
