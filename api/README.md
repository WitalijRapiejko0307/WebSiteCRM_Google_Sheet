# Lead form backend setup

`submit-lead.php` expects these environment variables:

- `TELEGRAM_BOT_TOKEN` - Telegram bot token.
- `TELEGRAM_CHAT_ID` - Telegram group chat id (usually negative number).
- `LEAD_EMAIL_TO` - Single destination email.
- `MAIL_FROM` - Optional sender, e.g. `no-reply@your-domain.com`.

## Local `.env` file (project root)

After valid requests pass rate limiting, `submit-lead.php` loads **`/.env`** next to the site root (same directory as `index.html`, not inside `api/`). Use the committed template:

1. Copy `.env.example` to `.env` in the repository root.
2. Fill in values. Lines are `KEY=value`; `#` starts a comment; optional quotes around values are stripped.

**Precedence:** If the host already defines a variable (cPanel, `.htaccess` `SetEnv`, PHP-FPM pool, etc.), that value is kept; `.env` only fills variables that are **not** already set.

`.env` is listed in `.gitignore` and must not be committed.

## Example (Apache/Nginx environment)

Set variables in your host config or process environment, then expose:

- `/api/submit-lead.php`

The script accepts `POST` form fields:

- `name` (required)
- `phone` (optional if `contactHandle` filled)
- `contactHandle` (optional if `phone` filled)
- `website` (honeypot, must stay empty)

## JSON response (success)

When the lead is **actually delivered** (Telegram and/or email succeeded), the response is `200` with:

- `ok`: `true`
- `message`: user-facing string
- `thankYou`: `true` — front end redirects to the thank-you page for conversion tracking
- `thankYouPath`: relative path to the thank-you page (default `./thank-you.html`)

Honeypot submissions still return `ok: true` but **without** `thankYou`, so ad pixels are not triggered.

**Conversion URL for ad platforms:** use your site origin + `/thank-you.html` (for example `https://crm-gs.pro/thank-you.html`). Place pixel / gtag snippets only in `thank-you.html` (see comments `conversion-pixels:head` / `conversion-pixels:body`).
