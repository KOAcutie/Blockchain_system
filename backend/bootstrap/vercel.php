<?php

// Vercel's application bundle is read-only; only temporary runtime files belong here.
$runtimePath = sys_get_temp_dir().'/ssc-transparency';
$storagePath = $runtimePath.'/storage';
$cachePath = $runtimePath.'/bootstrap/cache';

foreach ([
    $storagePath.'/app/public',
    $storagePath.'/framework/cache/data',
    $storagePath.'/framework/sessions',
    $storagePath.'/framework/views',
    $storagePath.'/logs',
    $cachePath,
] as $directory) {
    if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
        throw new RuntimeException("Unable to create runtime directory: {$directory}");
    }
}

foreach ([
    'LARAVEL_STORAGE_PATH' => $storagePath,
    'APP_CONFIG_CACHE' => $cachePath.'/config.php',
    'APP_EVENTS_CACHE' => $cachePath.'/events.php',
    'APP_PACKAGES_CACHE' => $cachePath.'/packages.php',
    'APP_ROUTES_CACHE' => $cachePath.'/routes.php',
    'APP_SERVICES_CACHE' => $cachePath.'/services.php',
    'VIEW_COMPILED_PATH' => $storagePath.'/framework/views',
] as $name => $value) {
    putenv("{$name}={$value}");
    $_ENV[$name] = $_SERVER[$name] = $value;
}
