<?php
/** Privacy-conscious, first-party pageview collector for nextpuzzleai.com. */
declare(strict_types=1);

const SITE = 'nextpuzzleai.com';

function finish(int $code): void {
    http_response_code($code);
    header('Cache-Control: no-store');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') finish(405);
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
if ($origin !== '' && stripos($origin, SITE) === false) finish(403);
if (($_COOKIE['np_analytics_consent'] ?? '') !== 'accepted') finish(403);

$raw = file_get_contents('php://input', false, null, 0, 4097);
if ($raw === false || strlen($raw) > 4096) finish(413);
$data = json_decode($raw, true);
if (!is_array($data) || ($data['event'] ?? '') !== 'pageview') finish(422);

$visitor = (string)($data['visitor'] ?? '');
if (!preg_match('/^[a-zA-Z0-9-]{20,64}$/', $visitor)) finish(422);
if (!hash_equals((string)($_COOKIE['np_analytics'] ?? ''), $visitor)) finish(403);

$path = substr((string)($data['path'] ?? '/'), 0, 300);
if ($path === '' || $path[0] !== '/') $path = '/';
$referrer = substr(preg_replace('/[^a-zA-Z0-9.:-]/', '', (string)($data['referrer'] ?? '')), 0, 200);
$language = substr(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($data['language'] ?? '')), 0, 20);
$width = max(0, min(10000, (int)($data['width'] ?? 0)));

$record = [
    'time' => gmdate('c'),
    'event' => 'pageview',
    'visitor' => hash('sha256', SITE . '|' . $visitor),
    'path' => $path,
    'referrer_host' => $referrer,
    'viewport_width' => $width,
    'language' => $language,
];

// Keep analytics outside every public web directory. No IP address or user agent is stored.
$directory = dirname(__DIR__, 2) . '/nextpuzzle-analytics';
if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) finish(500);
$file = $directory . '/events-' . gmdate('Y-m') . '.jsonl';
$written = file_put_contents($file, json_encode($record, JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
if ($written === false) finish(500);
@chmod($file, 0600);
finish(204);
