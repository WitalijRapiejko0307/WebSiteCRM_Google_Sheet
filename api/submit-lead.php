<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed.']);
    exit;
}

const RATE_WINDOW_SECONDS = 120;
const MAX_REQUESTS_PER_WINDOW = 4;

function jsonResponse(int $statusCode, bool $ok, string $message): void
{
    http_response_code($statusCode);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Successful lead delivery: client may redirect for conversion tracking (not used for honeypot). */
function jsonLeadDeliveredResponse(string $message): void
{
    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'thankYou' => true,
        'thankYouPath' => './thank-you.html',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function normalize(?string $value): string
{
    return trim((string) $value);
}

function getClientIp(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $parts = explode(',', $forwarded);
        return trim($parts[0]);
    }

    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

function isRateLimited(string $ip): bool
{
    $directory = sys_get_temp_dir() . '/crm_lead_rate_limit';
    if (!is_dir($directory) && !@mkdir($directory, 0775, true) && !is_dir($directory)) {
        return false;
    }

    $file = $directory . '/' . sha1($ip) . '.json';
    $currentTime = time();
    $history = [];

    if (is_file($file)) {
        $raw = file_get_contents($file);
        if ($raw !== false) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $history = $decoded;
            }
        }
    }

    $history = array_values(array_filter($history, static function ($timestamp) use ($currentTime) {
        return is_int($timestamp) && $timestamp > $currentTime - RATE_WINDOW_SECONDS;
    }));

    if (count($history) >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }

    $history[] = $currentTime;
    @file_put_contents($file, json_encode($history), LOCK_EX);
    return false;
}

/** Load KEY=VALUE lines from a local .env (does not override existing getenv). */
function loadEnvFile(string $path): void
{
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }

        $name = trim(substr($line, 0, $eq));
        if ($name === '' || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
            continue;
        }

        $value = trim(substr($line, $eq + 1));
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"') && strlen($value) >= 2) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'") && strlen($value) >= 2)
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) !== false) {
            continue;
        }

        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

function getEnvValue(string $key): string
{
    $value = getenv($key);
    return is_string($value) ? trim($value) : '';
}

function sendTelegram(string $botToken, string $chatId, string $text): bool
{
    if ($botToken === '' || $chatId === '') {
        return false;
    }

    if (!function_exists('curl_init')) {
        return false;
    }

    $url = 'https://api.telegram.org/bot' . $botToken . '/sendMessage';

    $payload = http_build_query([
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => 'true',
    ]);

    $ch = curl_init($url);
    if ($ch === false) {
        return false;
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 8,
    ]);

    $result = curl_exec($ch);
    $ok = $result !== false && curl_errno($ch) === 0;
    curl_close($ch);

    if (!$ok || !is_string($result)) {
        return false;
    }

    $decoded = json_decode($result, true);
    return is_array($decoded) && ($decoded['ok'] ?? false) === true;
}

function sendEmail(string $to, string $subject, string $body, string $from): bool
{
    if ($to === '') {
        return false;
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $from,
        'Reply-To: ' . $from,
    ];

    return @mail($to, $subject, $body, implode("\r\n", $headers));
}

$name = normalize($_POST['name'] ?? '');
$phone = normalize($_POST['phone'] ?? '');
$contactHandle = normalize($_POST['contactHandle'] ?? '');
$website = normalize($_POST['website'] ?? '');

if ($website !== '') {
    jsonResponse(200, true, 'Заявка принята.');
}

if ($name === '' || mb_strlen($name) > 120) {
    jsonResponse(422, false, 'Проверьте поле "Имя".');
}

if ($phone === '' && $contactHandle === '') {
    jsonResponse(422, false, 'Укажите телефон или Telegram/Instagram.');
}

if (mb_strlen($phone) > 64 || mb_strlen($contactHandle) > 120) {
    jsonResponse(422, false, 'Слишком длинные контактные данные.');
}

$ip = getClientIp();
if (isRateLimited($ip)) {
    jsonResponse(429, false, 'Слишком много попыток. Повторите чуть позже.');
}

loadEnvFile(dirname(__DIR__) . '/.env');

$botToken = getEnvValue('TELEGRAM_BOT_TOKEN');
$chatId = getEnvValue('TELEGRAM_CHAT_ID');
$leadEmail = getEnvValue('LEAD_EMAIL_TO');
$mailFrom = getEnvValue('MAIL_FROM');

if ($mailFrom === '') {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $mailFrom = 'no-reply@' . preg_replace('/:\d+$/', '', $host);
}

$timestamp = date('Y-m-d H:i:s');
$nameSafe = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$phoneSafe = htmlspecialchars($phone !== '' ? $phone : '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$handleSafe = htmlspecialchars($contactHandle !== '' ? $contactHandle : '-', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$ipSafe = htmlspecialchars($ip, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$tgMessage = "<b>Новая заявка с сайта</b>\n"
    . "Имя: {$nameSafe}\n"
    . "Телефон: {$phoneSafe}\n"
    . "Telegram/Instagram: {$handleSafe}\n"
    . "IP: {$ipSafe}\n"
    . "Время: {$timestamp}";

$emailSubject = 'Новая заявка с сайта CRM';
$emailBody = "Новая заявка с сайта\n\n"
    . "Имя: {$name}\n"
    . "Телефон: " . ($phone !== '' ? $phone : '-') . "\n"
    . "Telegram/Instagram: " . ($contactHandle !== '' ? $contactHandle : '-') . "\n"
    . "IP: {$ip}\n"
    . "Время: {$timestamp}\n";

$telegramSent = sendTelegram($botToken, $chatId, $tgMessage);
$emailSent = sendEmail($leadEmail, $emailSubject, $emailBody, $mailFrom);

if ($telegramSent || $emailSent) {
    jsonLeadDeliveredResponse('Спасибо! Заявка отправлена.');
}

error_log('Lead delivery failed: both Telegram and email failed.');
jsonResponse(500, false, 'Не удалось отправить заявку. Попробуйте еще раз.');
