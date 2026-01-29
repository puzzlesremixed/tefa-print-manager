<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
  ->withRouting(
    web: __DIR__ . '/../routes/web.php',
    api: __DIR__ . '/../routes/api.php',
    commands: __DIR__ . '/../routes/console.php',
    health: '/up',
  )
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

    $middleware->web(append: [
      HandleAppearance::class,
      HandleInertiaRequests::class,
      AddLinkHeadersForPreloadedAssets::class,
    ]);
  })
  ->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->renderable(function (Exception $e, Request $request) {
      if ($e instanceof ValidationException && $request->is('api/*')) {
         return new JsonResponse([
             'message' => 'The given data was invalid.',
             'errors' => $e->errors(),
         ], 422);
     }
      
     if ($e instanceof PostTooLargeException && $request->is('api/*')) {
         return new JsonResponse([
             'message' => 'The size of the data is too large.',
         ], 422);
     }
    });
  })->create();
