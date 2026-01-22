<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
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
  
    // Throw custom error when the uploaded file exceeded the server file limit
    $exceptions->renderable(function (PostTooLargeException $e, Request $request) {
      if ($request->is('api/*')) {
        return response()->json([
          'status' => 413,
          'message' => 'The size of the data is too large.',
        ], Response::HTTP_REQUEST_ENTITY_TOO_LARGE);
      }
    });
  })->create();
