<?php

declare(strict_types=1);

$publicPath = __DIR__;
$projectRoot = dirname(__DIR__);
$target = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'public';
$link = $publicPath . DIRECTORY_SEPARATOR . 'storage';

function renderMessage(string $title, string $message, bool $success = true): void
{
    $color = $success ? '#0f9d58' : '#d93025';
    $bg = $success ? '#f0fff4' : '#fff5f5';

    echo "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Storage Link Helper</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f7fb; padding: 32px; }
        .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .status { color: {$color}; background: {$bg}; border-left: 4px solid {$color}; padding: 14px 16px; border-radius: 8px; margin-bottom: 16px; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        ul { margin-top: 10px; }
    </style>
</head>
<body>
    <div class=\"card\">
        <h2>{$title}</h2>
        <div class=\"status\">{$message}</div>
        <p><strong>Important:</strong> delete this file after use for security.</p>
    </div>
</body>
</html>";
    exit;
}

function copyDirectory(string $source, string $destination): bool
{
    if (!is_dir($source)) {
        return false;
    }

    if (!is_dir($destination) && !mkdir($destination, 0755, true) && !is_dir($destination)) {
        return false;
    }

    $items = scandir($source);
    if ($items === false) {
        return false;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $src = $source . DIRECTORY_SEPARATOR . $item;
        $dst = $destination . DIRECTORY_SEPARATOR . $item;

        if (is_dir($src)) {
            if (!copyDirectory($src, $dst)) {
                return false;
            }
        } elseif (!copy($src, $dst)) {
            return false;
        }
    }

    return true;
}

if (!is_dir($target)) {
    renderMessage('Storage target missing', 'The folder <code>storage/app/public</code> was not found. Upload your project files first.', false);
}

if (is_link($link)) {
    renderMessage('Already linked', 'The <code>public/storage</code> symlink already exists. No action was needed.');
}

if (is_dir($link) && !is_link($link)) {
    if (copyDirectory($target, $link)) {
        renderMessage('Directory already exists', 'The <code>public/storage</code> folder already existed, so files were synced into it successfully.');
    }

    renderMessage('Storage folder exists', 'The <code>public/storage</code> folder already exists, but syncing files failed. Remove it manually and try again.', false);
}

if (function_exists('symlink')) {
    @symlink($target, $link);

    if (is_link($link)) {
        renderMessage('Success', 'The storage symlink was created successfully: <code>public/storage</code> → <code>storage/app/public</code>.');
    }
}

if (copyDirectory($target, $link)) {
    renderMessage('Fallback completed', 'Symlink is not available on this hosting, so the storage files were copied into <code>public/storage</code> instead.');
}

renderMessage('Failed', 'Could not create the storage link or copy the files. Check file permissions for <code>public</code> and <code>storage</code>.', false);
