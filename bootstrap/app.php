<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        $middleware->api(prepend: [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $renderNotFoundPage = function (Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            return Inertia::render('Public/NotFound')
                ->toResponse($request)
                ->setStatusCode(404);
        };

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($renderNotFoundPage) {
            return $renderNotFoundPage($request);
        });

        $exceptions->render(function (ModelNotFoundException $exception, Request $request) use ($renderNotFoundPage) {
            return $renderNotFoundPage($request);
        });
    })->create();
