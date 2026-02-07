<?php

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
  public function handle(Request $request, Closure $next)
  {
    $start = microtime(true);
    $response = $next($request);

    // Only log API responses
    if (! $request->is('api/*')) {
      return $response;
    }

    $status = $response->getStatusCode();

    // Only log failed responses (recommended)
    if ($status < 400) {
      return $response;
    }

    $responseData = null;

    if ($response instanceof JsonResponse) {
      $data = $response->getData(true);

      // Limit payload size
      if (strlen(json_encode($data)) < 10_000) {
        $responseData = $this->sanitize($data);
      } else {
        $responseData = '[response too large]';
      }
    }

    activity('api')
      ->causedBy($request->user())
      ->withProperties([
        'method'   => $request->method(),
        'path'     => $request->path(),
        'status'   => $status,
        'duration' => round((microtime(true) - $start) * 1000, 2),
        'request'  => [
          'query'   => $request->query(),
          'payload' => $request->except(['password', 'password_confirmation']),
        ],
        'response' => $responseData,
      ])
      ->log('API request failed');

    return $response;
  }

  protected function sanitize(array $data): array
  {
    return collect($data)->except([
      'token',
      'access_token',
      'refresh_token',
      'password',
    ])->toArray();
  }
}
