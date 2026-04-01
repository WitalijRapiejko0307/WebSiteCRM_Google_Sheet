# CRM Landing

Проект хранится в Git, а выкладка на хостинг идет по FTP через GitHub Actions.

## 1) Инициализация и первая отправка в GitHub

```bash
git branch -M main
git add .
git commit -m "Initial project setup with FTP deploy workflow"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 2) Настройка GitHub Secrets

В репозитории GitHub откройте `Settings -> Secrets and variables -> Actions` и добавьте:

- `FTP_HOST` = `vh151.hoster.by`
- `FTP_USER` = `crmgspro`
- `FTP_PASSWORD` = ваш FTP пароль
- `FTP_REMOTE_DIR` = `/home/crmgspro/public_html/`
- `FTP_PORT` = `21`

Важно: не храните пароль в коде или в `.env`, который коммитится в репозиторий.

## 3) Релиз

- Вносите изменения локально.
- Выполняйте `git add . && git commit -m "..." && git push`.
- После `push` в `main` workflow `.github/workflows/deploy.yml` автоматически загрузит файлы на хостинг.

## 4) Откат

Вариант A (без переписывания истории):

```bash
git revert <bad_commit_sha>
git push
```

Вариант B (вернуть состояние на конкретный коммит новым коммитом):

```bash
git checkout <good_commit_sha> -- .
git commit -m "Rollback to <good_commit_sha>"
git push
```

После `push` будет повторный деплой стабильной версии.
