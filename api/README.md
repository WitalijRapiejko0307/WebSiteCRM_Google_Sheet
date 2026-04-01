# Lead form backend setup

`submit-lead.php` expects these environment variables:

- `TELEGRAM_BOT_TOKEN` - Telegram bot token.
- `TELEGRAM_CHAT_ID` - Telegram group chat id (usually negative number).
- `LEAD_EMAIL_TO` - Single destination email.
- `MAIL_FROM` - Optional sender, e.g. `no-reply@your-domain.com`.

## Example (Apache/Nginx environment)

Set variables in your host config or process environment, then expose:

- `/api/submit-lead.php`

The script accepts `POST` form fields:

- `name` (required)
- `phone` (optional if `contactHandle` filled)
- `contactHandle` (optional if `phone` filled)
- `website` (honeypot, must stay empty)
