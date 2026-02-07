<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LogController extends Controller
{
  public function index()
  {
    return inertia('logs', [
      'logs' => Activity::where('log_name', 'api')
        ->latest()
        ->paginate(50)
    ]);
  }

  public function show(Activity $activity)
  {
    abort_unless($activity->log_name === 'api', 404);

    return inertia('logs/show', [
      'log' => $activity,
    ]);
  }
}
