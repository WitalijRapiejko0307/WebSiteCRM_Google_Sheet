<?php
/**
 * TEMPORARY diagnostic script — delete after use.
 * Access: /api/diag.php?key=YOUR_SECRET_KEY
 */
declare(strict_types=1);

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        $n = strlen($needle);
        if ($n === 0) {
            return true;
        }

        return strlen($haystack) >= $n && substr_compare($haystack, $needle, -$n) === 0;
    }
}

header('Content-Type: application/json; charset=utf-8');

define('DIAG_KEY', 'crm-diag-2026');

if (($_GET['key'] ?? '') !== DIAG_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'forbidden']);
    exit;
}

// ── 1. Env file ────────────────────────────────────────────────────────────
$envPath = dirname(__DIR__) . '/.env';
$envReadable = is_readable($envPath);
$envExists   = file_exists($envPath);

if ($envReadable) {
    $raw = file_get_contents($envPath);
    $lines = $raw !== false ? substr_count($raw, "\n") + 1 : 0;
} else {
    $lines = 0;
}

// Load env the same way the lead script does
function loadEnvDiag(string $path): array
{
    $loaded = [];
    if (!is_readable($path)) {
        return $loaded;
    }
    $file = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($file === false) {
        return $loaded;
    }
    foreach ($file as $line) {
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
        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
        $loaded[] = $name;
    }
    return $loaded;
}

$loadedKeys = loadEnvDiag($envPath);

$botToken = trim((string)(getenv('TELEGRAM_BOT_TOKEN') ?: ''));
$chatId   = trim((string)(getenv('TELEGRAM_CHAT_ID')   ?: ''));
$leadEmail = trim((string)(getenv('LEAD_EMAIL_TO')     ?: ''));

// ── 2. cURL ───────────────────────────────────────────────────────────────
$curlAvailable = function_exists('curl_init');
$curlInfo      = $curlAvailable ? curl_version() : null;
$curlVersion   = is_array($curlInfo) ? ($curlInfo['version'] ?? 'unknown') : null;

// ── 3. Test Telegram (only if token+chatId present) ───────────────────────
$tgTest = null;
if ($curlAvailable && $botToken !== '' && $chatId !== '') {
    $url = 'https://api.telegram.org/bot' . $botToken . '/getMe';
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT        => 8,
    ]);
    $res = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($res === false || $curlError !== '') {
        $tgTest = ['ok' => false, 'error' => $curlError];
    } else {
        $decoded = json_decode($res, true);
        $tgTest  = [
            'ok'       => is_array($decoded) && ($decoded['ok'] ?? false) === true,
            'httpCode' => $httpCode,
            'botName'  => is_array($decoded) ? ($decoded['result']['username'] ?? null) : null,
        ];
    }
}

// ── 4. allow_url_fopen (legacy info) ─────────────────────────────────────
$allowUrlFopen = filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN);

// ── Output ────────────────────────────────────────────────────────────────
$payload = [
    'envFile' => [
        'expectedPath' => $envPath,
        'exists'       => $envExists,
        'readable'     => $envReadable,
        'lineCount'    => $lines,
        'loadedKeys'   => $loadedKeys,
    ],
    'vars' => [
        'TELEGRAM_BOT_TOKEN' => $botToken !== '' ? '*** set (' . strlen($botToken) . ' chars)' : '(empty)',
        'TELEGRAM_CHAT_ID'   => $chatId   !== '' ? $chatId                                      : '(empty)',
        'LEAD_EMAIL_TO'      => $leadEmail !== '' ? $leadEmail                                   : '(empty)',
    ],
    'curl' => [
        'available' => $curlAvailable,
        'version'   => $curlVersion,
    ],
    'telegramApiTest' => $tgTest,
    'allow_url_fopen' => $allowUrlFopen,
    'phpVersion'      => PHP_VERSION,
    'serverDir'       => __DIR__,
];

$jsonFlags = JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT;
if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
}

$out = json_encode($payload, $jsonFlags);
if ($out === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'json_encode failed: ' . json_last_error_msg();
    exit;
}

echo $out;
