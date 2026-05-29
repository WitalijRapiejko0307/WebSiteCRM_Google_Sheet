# CRM Landing

Статический лендинг. Публикация: **GitHub Pages** + домен **crm-gs.pro** (файл `CNAME`).

## Деплой

1. В репозитории: **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.
2. После `git push` в `main` запускается workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
3. Статус: **Actions** → **Deploy GitHub Pages** (зелёная галочка = сайт обновлён).

FTP-хостинг не используется (старый workflow отключён).

## Локальная разработка

Откройте `index.html` через локальный сервер или расширение Live Server — форма шлёт заявки в Google Apps Script (см. `google-apps-script/README.md`).

## Форма заявок

- Логика отправки: `script.js` → Web App Google Apps Script.
- PHP (`api/submit-lead.php`) на GitHub Pages не выполняется; файл оставлен для справки / переноса на хостинг с PHP.

## DNS для crm-gs.pro

У регистратора домена:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<user>.github.io` (опционально) |

Либо одна запись **ALIAS/ANAME** на `<user>.github.io`, если поддерживается регистратором.

В GitHub: **Settings → Pages → Custom domain** → `crm-gs.pro`, включить **Enforce HTTPS**.

## Откат

```bash
git revert <commit_sha>
git push origin main
```
