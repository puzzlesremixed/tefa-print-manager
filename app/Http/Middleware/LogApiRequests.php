<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
  public function handle(Request $request, Closure $next)
  {

    $request->attributes->set('api_log_start', microtime(true));
    return $next($request);
  }

  /**
   * Runs AFTER the response is sent
   */
  public function terminate(Request $request, Response $response): void
  {
    if (! $request->is('api/*')) {
      return;
    }


    $start = $request->attributes->get('api_log_start');
    $status = $response->getStatusCode();

    // If errors, and request method is either get/head
    if ($status < 400 && ($request->method() == 'GET' | $request->method() == 'HEAD' | $request->method() == 'OPTIONS')) {
        return;
    }

    $responseData = null;

    if ($response instanceof JsonResponse) {
      $data = $response->getData(true);

      $jsonSize = strlen(json_encode($data));


      // $responseData = $jsonSize < 10_000
      //   ? $this->sanitize($data)
      //   : '[response too large]';

      $responseData = $this->sanitize($data);
    }

    activity('api')
      ->causedBy($request->user())
      ->withProperties([
        'method'   => $request->method(),
        'path'     => $request->path(),
        'url'      => $request->fullUrl(),
        'ip'       => $request->ip(),
        'user_id'  => optional($request->user())->id,
        'status'   => $status,
        'duration' => round((microtime(true) - $start) * 1000, 2),
        'request'  => [
          'query'   => $request->query(),
          'payload' => $request->except([
            'password',
            'password_confirmation',
          ]),
        ],
        'response' => $responseData,
      ])
      ->log('API request failed');
  }

  protected function sanitize(array $data): array
  {
    return collect($data)->except([
      'password',
      'token',
      'access_token',
      'refresh_token',
    ])->toArray();
  }
}
