# Google Apps Script (Web App)

Фронтенд отправляет заявки из `form-handler.js` на URL Web App (`GOOGLE_SCRIPT_URL`).

## Тело запроса

`POST`, `Content-Type: text/plain;charset=utf-8`, тело — JSON:

```json
{
  "name": "Иван",
  "phone": "+375...",
  "contactHandle": "@nick",
  "website": ""
}
```

Поле `website` — honeypot (должно быть пустым у людей).

## Ответ (как у `submit-lead.php`)

Успешная доставка в Telegram и/или email:

```json
{
  "ok": true,
  "message": "Спасибо! Заявка отправлена.",
  "thankYou": true,
  "thankYouPath": "./thank-you.html"
}
```

Honeypot (без отправки, без пикселей):

```json
{ "ok": true, "message": "Заявка принята." }
```

Ошибка валидации / доставки:

```json
{ "ok": false, "message": "Текст ошибки на русском" }
```

## Секреты

Храните в **Script properties** (не в репозитории):

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `LEAD_EMAIL_TO`

Деплой: **Deploy → New deployment → Web app**, Execute as **Me**, Who has access **Anyone**.
