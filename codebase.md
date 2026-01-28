# .editorconfig

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 4
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[compose.yaml]
indent_size = 4

```

# .gitattributes

```
* text=auto eol=lf

*.blade.php diff=html
*.css diff=css
*.html diff=html
*.md diff=markdown
*.php diff=php

CHANGELOG.md export-ignore
README.md export-ignore
.github/workflows/browser-tests.yml export-ignore

```

# .github\workflows\lint.yml

```yml
name: linter

on:
  push:
    branches:
      - develop
      - main
  pull_request:
    branches:
      - develop
      - main

permissions:
  contents: write

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'

      - name: Install Dependencies
        run: |
          composer install -q --no-ansi --no-interaction --no-scripts --no-progress --prefer-dist
          npm install

      - name: Run Pint
        run: composer lint

      - name: Format Frontend
        run: npm run format

      - name: Lint Frontend
        run: npm run lint

      # - name: Commit Changes
      #   uses: stefanzweifel/git-auto-commit-action@v7
      #   with:
      #     commit_message: fix code style
      #     commit_options: '--no-verify'

```

# .github\workflows\tests.yml

```yml
name: tests

on:
  push:
    branches:
      - develop
      - main
  pull_request:
    branches:
      - develop
      - main

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php-version: ['8.4', '8.5']

    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php-version }}
          tools: composer:v2
          coverage: xdebug

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Node Dependencies
        run: npm i

      - name: Install Dependencies
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: Build Assets
        run: npm run build

      - name: Copy Environment File
        run: cp .env.example .env

      - name: Generate Application Key
        run: php artisan key:generate

      - name: Tests
        run: ./vendor/bin/pest

```

# .gitignore

```
/.phpunit.cache
/bootstrap/ssr
/node_modules
/public/build
/public/hot
/public/storage
/resources/js/actions
/resources/js/routes
/resources/js/wayfinder
/storage/*.key
/storage/pail
/vendor
.DS_Store
.env
.env.backup
.env.production
.phpactor.json
.phpunit.result.cache
Homestead.json
Homestead.yaml
npm-debug.log
yarn-error.log
/auth.json
/.fleet
/.idea
/.nova
/.vscode
/.zed

```

# .prettierignore

```
resources/js/components/ui/*
resources/views/mail/*

```

# .prettierrc

```
{
  "semi": true,
  "singleQuote": true,
  "singleAttributePerLine": false,
  "htmlWhitespaceSensitivity": "css",
  "printWidth": 80,
  "plugins": [
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwindcss"
  ],
  "tailwindFunctions": ["clsx", "cn"],
  "tailwindStylesheet": "resources/css/app.css",
  "tabWidth": 2,
  "overrides": [
    {
      "files": "**/*.yml",
      "options": {
        "tabWidth": 2
      }
    }
  ]
}

```

# app\Actions\Fortify\CreateNewUser.php

```php
<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}

```

# app\Actions\Fortify\ResetUserPassword.php

```php
<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validate and reset the user's forgotten password.
     *
     * @param  array<string, string>  $input
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        $user->forceFill([
            'password' => $input['password'],
        ])->save();
    }
}

```

# app\Concerns\PasswordValidationRules.php

```php
<?php

namespace App\Concerns;

use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }
}

```

# app\Concerns\ProfileValidationRules.php

```php
<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}

```

# app\Http\Controllers\Api\PrinterWebhookController.php

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintJobDetail;
use App\Services\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrinterWebhookController extends Controller
{
  public function handle(Request $request, PrinterService $printerService)
  {
    $validated = $request->validate([
      'job_detail_id' => 'required|exists:print_job_details,id', // Matches standard ID or customized payload
      'status' => 'required|in:completed,failed,cancelled',
      'message' => 'nullable|string'
    ]);

    $detail = PrintJobDetail::find($validated['job_detail_id']);

    if (!$detail) {
        return response()->json(['message' => 'Job not found'], 404);
    }

    // Only update if it's currently printing or queued (avoid overwriting final states)
    if (in_array($detail->status, ['printing', 'queued'])) {
        $detail->setStatus($validated['status'], $validated['message'] ?? 'Update from Print Server');
        
        // Update the parent job status based on this new detail status
        $detail->job->updateAggregatedStatus();

        Log::info("Job {$detail->id} webhook update: {$validated['status']}");

        // Trigger next item in queue
        $printerService->processNextItem();
    }

    return response()->json(['message' => 'Status updated, next job triggered']);
  }
}

```

# app\Http\Controllers\Controller.php

```php
<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

abstract class Controller
{
    public function index()
    {
        return Inertia::render('User/Show');
    }
}

```

# app\Http\Controllers\HistoryController.php

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PrintJob;
use Inertia\Inertia;

class HistoryController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $pastFiles = (clone $query)
      ->where('status', 'cancelled')
      ->orderBy('created_at', 'asc')
      ->get();

    return Inertia::render('history', [
      'pastFiles' => $pastFiles,
    ]);
  }
}

```

# app\Http\Controllers\PrinterController.php

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class PrinterController extends Controller
{
    // Removing Type Hint to match Parent::index()
    public function index()
    {
        try {
            $printerApiUrl = 'http://localhost:8080/printers'; // Should be in config
            $response = Http::timeout(5)->get($printerApiUrl);

            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch printer list from the print server.',
                    'details' => $response->json() ?? $response->body(),
                ], $response->status());
            }

            return response()->json($response->json());

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to the print server.',
                'error' => $e->getMessage(),
            ], 503); // Service Unavailable
        }
    }
}

```

# app\Http\Controllers\PrinterWebhookController.php

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintJobDetail;
use App\Services\PrinterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// TODO : Work in progress
class PrinterWebhookController extends Controller
{
  public function handle(Request $request, PrinterService $printerService)
  {
    $validated = $request->validate([
      'job_id' => 'required|exists:print_job_details,id',
      'status' => 'required|in:completed,failed,cancelled', // Status from the printer
      'message' => 'nullable|string'
    ]);

    $detail = PrintJobDetail::find($validated['job_id']);

    // This marks the item as done, which means the "isBusy" check in the Service 
    $detail->setStatus($validated['status'], $validated['message'] ?? 'Update from Print Server');

    Log::info("Job {$detail->id} finished with status: {$validated['status']}");

    $printerService->processNextItem();

    return response()->json(['message' => 'Status updated, next job triggered']);
  }
}

```

# app\Http\Controllers\PrintJobController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\PrintJob;
use App\Models\PrintJobDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use setasign\Fpdi\Fpdi;

class PrintJobController extends Controller
{
  // TODO : Create an interface for editing this
  const PRICE_BNW = 500;
  const PRICE_COLOR = 1000;

  public function store(Request $request)
  {
    $colorRule = function ($attribute, $value, $fail) {
      if (in_array(strtolower($value), ['color', 'bnw', 'auto'])) {
        return;
      }

      // Must be either a simple range (e.g., "1-10") or a comma-separated list of numbers (e.g., "1,2,3,7").
      // A mix like "1-3,7" is invalid.
      $isRange = preg_match('/^[1-9]\d*-[1-9]\d*$/', $value);
      $isList = preg_match('/^[1-9]\d*(,[1-9]\d*)*$/', $value);

      if (!$isRange && !$isList) {
        $fail($attribute . ' is not a valid page range format. Use a format like "1-10" or "1,2,3,7".');
        return;
      }

      if ($isRange) {
        list($start, $end) = explode('-', $value);
        if (intval($start) > intval($end)) {
          $fail($attribute . ' has an invalid range where start is greater than end.');
        }
      }
    };

    $validator = Validator::make($request->all(), [
      'customer_name' => 'required|string|max:255',
      'customer_number' => 'required|string|max:255',
      'items' => 'required|array',
      'items.*.file' => 'required|file',
      'items.*.color' => ['required', 'string', $colorRule],
    ]);

    if ($validator->fails()) {
      return response()->json([
        'message' => 'The given data was invalid.',
        'errors' => $validator->errors()
      ], 422);
    }


    try {

      $printJob = DB::transaction(function () use ($request) {

        $job = PrintJob::create([
          'customer_name' => $request->customer_name,
          'customer_number' => $request->customer_number,
          'total_price' => 0,
          'status' => 'pending_payment',
        ]);

        $runningTotal = 0;

        foreach ($request->items as $item) {
          $uploadedFile = $item['file'];
          $colorMode = $item['color'];

          // Force 'local' disk to ensure consistency with Asset model
          $path = $uploadedFile->store('print_uploads', 'local');

          $pages = $this->countPages($uploadedFile->getRealPath(), $uploadedFile->extension());

          $asset = Asset::create([
            'basename' => $uploadedFile->getClientOriginalName(),
            'filename' => $uploadedFile->hashName(),
            'path' => $path,
            'extension' => $uploadedFile->extension(),
            'pages' => $pages,
          ]);

          $numBnWPages = 0;
          $numColorPages = 0;
          $dbColorMode = $colorMode;

          switch (strtolower($colorMode)) {
            case 'color':
              $numColorPages = $pages;
              break;
            case 'bnw':
              $numBnWPages = $pages;
              break;
            case 'auto':
              $numBnWPages = $pages;
              $dbColorMode = 'bnw';
              break;
            default:
              // Assumes a page range for B&W pages, rest are color
              $bnwPagesArray = $this->parsePageRanges($colorMode);
              $bnwPageCount = 0;
              foreach ($bnwPagesArray as $page) {
                if ($page <= $pages) {
                  $bnwPageCount++;
                }
              }
              $numBnWPages = $bnwPageCount;
              $numColorPages = $pages - $numBnWPages;

              if ($numColorPages > 0) {
                $dbColorMode = 'color';
              } else {
                $dbColorMode = 'bnw';
              }
              break;
          }

          $itemPrice = ($numBnWPages * self::PRICE_BNW) + ($numColorPages * self::PRICE_COLOR);
          $runningTotal += $itemPrice;

          $detail = PrintJobDetail::create([
            'parent_id' => $job->id,
            'asset_id' => $asset->id,
            'print_color' => $dbColorMode,
            'price' => $itemPrice,
            'status' => 'pending',
          ]);

          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'File uploaded, waiting for payment'
          ]);
        }

        $job->update(['total_price' => $runningTotal]);

        return $job;
      });

      return response()->json([
        'message' => 'Order created successfully',
        'order_id' => $printJob->id,
        'total_price' => $printJob->total_price,
      ], 201);
    } catch (\Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }

  public function show(PrintJob $printJob)
  {
      return response()->json([
          'success' => true,
          'data' => $printJob->load(['details.asset', 'details.logs']),
      ]);
  }

  public function simulatePayment(PrintJob $printJob)
  {
    if ($printJob->status !== 'pending_payment') {

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'error' => 'Invalid Request',
          'message' => 'This order is not awaiting payment. Current status: ' . $printJob->status
        ], 400);
      }

      return back()->with('message', 'This order is not awaiting payment.');
    }

    try {
      DB::transaction(function () use ($printJob) {
        $printJob->update([
          'status' => 'pending'
        ]);

        foreach ($printJob->details as $detail) {
          $detail->logs()->create([
            'status' => 'pending',
            'message' => 'Payment received successfully. Waiting for print command.'
          ]);
        }
      });

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Payment successful',
          'status' => $printJob->fresh()->status
        ]);
      }

      return back()->with('message', 'Order marked as paid.');
    } catch (\Exception $e) {
      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json(['error' => 'Payment processing failed', 'details' => $e->getMessage()], 500);
      }
      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  public function cancelPrintJob(PrintJob $printJob)
  {
    if ($printJob->status == 'running' || $printJob->status ==  'failed' || $printJob->status == 'completed' || $printJob->status ==  'partially_failed') {

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'error' => 'Invalid Request',
          'message' => 'You cannot candel this print job. Current status: ' . $printJob->status
        ], 400);
      }

      return back()->with('message', 'You cannot candel this print job.');
    }

    try {
      DB::transaction(function () use ($printJob) {
        $printJob->update([
          'status' => 'cancelled'
        ]);

        foreach ($printJob->details as $detail) {
          $detail->logs()->create([
            'status' => 'cancelled',
            'message' => 'Print job cancelled by admin.'
          ]);
        }
      });

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Print job cancelled.',
          'status' => $printJob->fresh()->status
        ]);
      }

      return back()->with('message', 'Print job cancelled.');
    } catch (\Exception $e) {
      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json(['error' => 'Fail to cancel the print job', 'details' => $e->getMessage()], 500);
      }
      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  public function dispatchJob(PrintJob $printJob,  \App\Services\PrinterService $printerService)
  {
    try {
      // If pending, dispatch it. If queued, it's fine. Otherwise error.
      if ($printJob->status === 'pending') {
          $printJob->dispatchToQueue();
      } elseif ($printJob->status !== 'queued') {
          throw new \Exception("Job cannot be queued. Current status: {$printJob->status}. Required: pending or queued.");
      }

      $printerService->processNextItem();

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'message' => 'Job successfully queued',
          'status' => 'queued'
        ]);
      }

      return back()->with('message', 'Print job started successfully!');
    } catch (\Exception $e) {

      $statusCode = 400;

      if (request()->wantsJson() && !request()->header('X-Inertia')) {
        return response()->json([
          'error' => 'Dispatch failed',
          'message' => $e->getMessage()
        ], $statusCode);
      }

      return back()->withErrors(['status' => $e->getMessage()]);
    }
  }

  // Helper functions idk
  private function countPages($filePath, $extension): int
  {
    if (strtolower($extension) !== 'pdf') {
      return 1;
    }

    try {
      $pdf = new Fpdi();
      $pdf->setSourceFile($filePath);
      return $pdf->setSourceFile($filePath);
    } catch (\Exception $e) {
      return 1;
    }
  }

  private function parsePageRanges(string $rangeString): array
  {
    $pages = [];
    $parts = explode(',', $rangeString);

    foreach ($parts as $part) {
      $part = trim($part);
      if (strpos($part, '-') !== false) {
        list($start, $end) = explode('-', $part, 2);
        $start = intval(trim($start));
        $end = intval(trim($end));
        if ($start > 0 && $end >= $start) {
          $pages = array_merge($pages, range($start, $end));
        }
      } else {
        $page = intval($part);
        if ($page > 0) {
          $pages[] = $page;
        }
      }
    }

    return array_unique($pages);
  }
}

```

# app\Http\Controllers\QueueController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use Inertia\Inertia;

class QueueController extends Controller
{
  public function index()
  {
    $query = PrintJob::with(['details.asset']);

    $queuedFiles = (clone $query)
      ->whereIn('status', ['queued', 'running']) 
      ->orderBy('created_at', 'asc')
      ->get();

    $pendingFiles = (clone $query)
      ->where('status', 'pending')
      ->orderBy('created_at', 'asc')
      ->get();

    $waitingPaymentFiles = (clone $query)
      ->where('status', 'pending_payment')
      ->orderBy('created_at', 'desc')
      ->get();

    return Inertia::render('queue', [
      'queuedFiles' => $queuedFiles,
      'pendingFiles' => $pendingFiles,
      'waitingPaymentFiles' => $waitingPaymentFiles
    ]);
  }
}
```

# app\Http\Controllers\Settings\PasswordController.php

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/password');
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        return back();
    }
}

```

# app\Http\Controllers\Settings\ProfileController.php

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

```

# app\Http\Controllers\Settings\TwoFactorAuthenticationController.php

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class TwoFactorAuthenticationController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
            ? [new Middleware('password.confirm', only: ['show'])]
            : [];
    }

    /**
     * Show the user's two-factor authentication settings page.
     */
    public function show(TwoFactorAuthenticationRequest $request): Response
    {
        $request->ensureStateIsValid();

        return Inertia::render('settings/two-factor', [
            'twoFactorEnabled' => $request->user()->hasEnabledTwoFactorAuthentication(),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
        ]);
    }
}

```

# app\Http\Middleware\HandleAppearance.php

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        View::share('appearance', $request->cookie('appearance') ?? 'system');

        return $next($request);
    }
}

```

# app\Http\Middleware\HandleInertiaRequests.php

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}

```

# app\Http\Requests\Settings\PasswordUpdateRequest.php

```php
<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => $this->currentPasswordRules(),
            'password' => $this->passwordRules(),
        ];
    }
}

```

# app\Http\Requests\Settings\ProfileDeleteRequest.php

```php
<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'password' => $this->currentPasswordRules(),
        ];
    }
}

```

# app\Http\Requests\Settings\ProfileUpdateRequest.php

```php
<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->profileRules($this->user()->id);
    }
}

```

# app\Http\Requests\Settings\TwoFactorAuthenticationRequest.php

```php
<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Laravel\Fortify\Features;
use Laravel\Fortify\InteractsWithTwoFactorState;

class TwoFactorAuthenticationRequest extends FormRequest
{
    use InteractsWithTwoFactorState;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Features::enabled(Features::twoFactorAuthentication());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}

```

# app\Http\Requests\StorePrintJobRequest.php

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrintJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_number' => ['required', 'string', 'max:50'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.file' => ['required', 'file', 'mimes:pdf,jpg,png,doc,docx', 'max:10240'], // 10MB max
            'items.*.color' => ['required', 'in:color,bnw'],
        ];
    }
}

```

# app\Models\Asset.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Asset extends Model
{
    use HasUuids;

    protected $fillable = [
        'basename', 
        'filename', 
        'path', 
        'extension', 
        'pages'
    ];

    /**
     * Get the full path to the file for the printing service.
     */
    public function getFullPathAttribute(): string
    {
        // Explicitly using local disk to match controller
        return Storage::disk('local')->path($this->path);
    }

    public function printJobDetails(): HasMany
    {
        return $this->hasMany(PrintJobDetail::class);
    }
}

```

# app\Models\PrintJob.php

```php
<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class PrintJob extends Model
{
  use HasUuids;

  protected $fillable = [
    'customer_number',
    'customer_name',
    'total_price',
    'status',
  ];

  public function details(): HasMany
  {
    // Note: Foreign key is 'parent_id' per your schema
    return $this->hasMany(PrintJobDetail::class, 'parent_id');
  }

  public function scopeReadyToPrint($query)
  {
    return $query->where('status', 'queued')
      ->whereNull('locked_at')
      ->orderBy('priority', 'desc')
      ->orderBy('created_at', 'asc');
  }

  /**
   * Check if all files in this order are finished.
   */
  public function isCompletelyFinished(): bool
  {
    return $this->details->every(function ($detail) {
      return in_array($detail->status, ['completed', 'cancelled', 'failed']);
    });
  }


  /**
   * Dispatch the job to the printer queue.
   * Moves status from 'pending' to 'queued'.
   *
   * @throws Exception
   */
  public function dispatchToQueue(): void
  {
    if ($this->status !== 'pending') {
      throw new Exception("Job cannot be queued. Current status: {$this->status}. Required: pending.");
    }

    DB::transaction(function () {
      $this->update(['status' => 'queued']);

      foreach ($this->details as $detail) {
        if ($detail->status === 'pending') {
          $detail->setStatus('queued', 'Queued for printing.');
        }
      }
    });
  }

  /**
   * Re-evaluate the status of the PrintJob based on its details.
   */
  public function updateAggregatedStatus(): void
  {
    $this->load('details');
    $details = $this->details;

    if ($details->isEmpty()) {
      return;
    }

    $total = $details->count();
    $queued = $details->whereIn('status', ['queued', 'pending'])->count();
    $printing = $details->where('status', 'printing')->count();
    $completed = $details->where('status', 'completed')->count();
    $failed = $details->where('status', 'failed')->count();
    $cancelled = $details->where('status', 'cancelled')->count();

    // If any item is currently printing, the job is running
    if ($printing > 0) {
      if ($this->status !== 'running') {
        $this->update(['status' => 'running']);
      }
      return;
    }

    // If all items are processed (completed, failed, or cancelled)
    if (($completed + $failed + $cancelled) === $total) {
      if ($completed === $total) {
        $this->update(['status' => 'completed']);
      } elseif ($failed === $total) {
        $this->update(['status' => 'failed']);
      } elseif ($cancelled === $total) {
        $this->update(['status' => 'cancelled']);
      } else {
        // Mixed results
        $this->update(['status' => 'partially_failed']);
      }
      return;
    }

    // If we have some completed/failed items but still some queued, it's running
    if (($completed > 0 || $failed > 0) && $queued > 0) {
      if ($this->status !== 'running') {
        $this->update(['status' => 'running']);
      }
      return;
    }
  }
}

```

# app\Models\PrintJobDetail.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrintJobDetail extends Model
{
  use HasUuids;

  protected $table = 'print_job_details';

  protected $fillable = [
    'parent_id',
    'asset_id',
    'print_color',
    'price',
    'status',
    'priority',
    'attempts',
    'locked_at',
  ];

  protected $casts = [
    'locked_at' => 'datetime',
  ];

  // relationships

  public function job(): BelongsTo
  {
    return $this->belongsTo(PrintJob::class, 'parent_id');
  }

  public function asset(): BelongsTo
  {
    return $this->belongsTo(Asset::class);
  }

  public function logs(): HasMany
  {
    return $this->hasMany(PrintJobStatusLog::class, 'detail_id')->orderByDesc('created_at');
  }


  /**
   * Scope to find jobs that are ready to print.
   * Use: PrintJobDetail::readyToPrint()->first();
   */
  public function scopeReadyToPrint(Builder $query): void
  {
    $query->where('status', 'queued')
      ->orWhere('status', 'failed')
      ->whereNull('locked_at') // Ensure no other worker is holding it
      ->orderBy('priority', 'desc')
      ->orderBy('created_at', 'asc');
  }


  /**
   * Update status and automatically create a log entry.
   */
  public function setStatus(string $newStatus, ?string $message = null): void
  {
    $this->update([
      'status' => $newStatus,
      'attempts' => $newStatus === 'failed' ? $this->attempts + 1 : $this->attempts,
      'locked_at' => in_array($newStatus, ['completed', 'failed', 'cancelled']) ? null : $this->locked_at,
    ]);

    // Create the history log
    $this->logs()->create([
      'status' => $newStatus,
      'message' => $message
    ]);
  }
}

```

# app\Models\PrintJobStatusLog.php

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJobStatusLog extends Model
{
    use HasUuids;

    public $timestamps = false; 

    protected $fillable = [
        'detail_id',
        'status',
        'message',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function detail(): BelongsTo
    {
        return $this->belongsTo(PrintJobDetail::class, 'detail_id');
    }
}

```

# app\Models\User.php

```php
<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}

```

# app\Providers\AppServiceProvider.php

```php
<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}

```

# app\Providers\FortifyServiceProvider.php

```php
<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}

```

# app\Services\PrinterService.php

```php
<?php

namespace App\Services;

use App\Models\PrintJobDetail;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrinterService
{
    /**
     * Check if the printer is free and there are items waiting.
     * If so, send the next one.
     */
    public function processNextItem(): void
    {
        $isBusy = PrintJobDetail::where('status', 'printing')->exists();

        if ($isBusy) {
            return;
        }

        $nextItem = PrintJobDetail::readyToPrint()
            ->lockForUpdate()
            ->first();

        if (!$nextItem) {
            return;
        }

        $this->sendToExternalPrinter($nextItem);
    }

    private function sendToExternalPrinter(PrintJobDetail $detail): void
    {
        $detail->setStatus('printing', 'Sent to print server');
        $detail->job->updateAggregatedStatus();

        try {
            $printerApiUrl = 'http://localhost:8080/print';
            $filePath = $detail->asset->full_path;

            if (!file_exists($filePath)) {
                throw new \Exception("File not found at path: {$filePath}");
            }

            $response = Http::asMultipart()
                ->attach(
                    'files',
                    file_get_contents($filePath),
                    $detail->asset->basename
                )
                ->post($printerApiUrl, [
                    'monochrome' => $detail->print_color === 'bnw',
                    'copies' => 1,
                ]);

            if ($response->successful()) {
                $detail->setStatus('completed', 'Successfully processed by Print Server');
                $detail->job->updateAggregatedStatus();

                $this->processNextItem();

            } else {
                $errorMessage = 'Print Server rejected request: ' . $response->status();
                if ($response->json('message')) {
                    $errorMessage .= ' - ' . $response->json('message');
                } elseif ($response->json('error')) {
                    $errorMessage .= ' - ' . $response->json('error');
                } elseif ($response->json('errors')) {
                    $errorMessage .= ' - ' . json_encode($response->json('errors'));
                }

                $detail->setStatus('failed', $errorMessage);
                $detail->job->updateAggregatedStatus();

                $this->processNextItem();
            }

        } catch (\Exception $e) {
            $detail->setStatus('failed', 'Connection to Print Server failed: ' . $e->getMessage());
            $detail->job->updateAggregatedStatus();
            Log::error('Print Server Error: ' . $e->getMessage());

            $this->processNextItem();
        }
    }
}

```

# artisan

```
#!/usr/bin/env php
<?php

use Illuminate\Foundation\Application;
use Symfony\Component\Console\Input\ArgvInput;

define('LARAVEL_START', microtime(true));

// Register the Composer autoloader...
require __DIR__.'/vendor/autoload.php';

// Bootstrap Laravel and handle the command...
/** @var Application $app */
$app = require_once __DIR__.'/bootstrap/app.php';

$status = $app->handleCommand(new ArgvInput);

exit($status);

```

# bootstrap\app.php

```php
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

```

# bootstrap\cache\.gitignore

```
*
!.gitignore

```

# bootstrap\cache\packages.php

```php
<?php return array (
  'inertiajs/inertia-laravel' => 
  array (
    'providers' => 
    array (
      0 => 'Inertia\\ServiceProvider',
    ),
  ),
  'laravel/fortify' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Fortify\\FortifyServiceProvider',
    ),
  ),
  'laravel/pail' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Pail\\PailServiceProvider',
    ),
  ),
  'laravel/sail' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Sail\\SailServiceProvider',
    ),
  ),
  'laravel/sanctum' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Sanctum\\SanctumServiceProvider',
    ),
  ),
  'laravel/tinker' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Tinker\\TinkerServiceProvider',
    ),
  ),
  'laravel/wayfinder' => 
  array (
    'providers' => 
    array (
      0 => 'Laravel\\Wayfinder\\WayfinderServiceProvider',
    ),
  ),
  'nesbot/carbon' => 
  array (
    'providers' => 
    array (
      0 => 'Carbon\\Laravel\\ServiceProvider',
    ),
  ),
  'nunomaduro/collision' => 
  array (
    'providers' => 
    array (
      0 => 'NunoMaduro\\Collision\\Adapters\\Laravel\\CollisionServiceProvider',
    ),
  ),
  'nunomaduro/termwind' => 
  array (
    'providers' => 
    array (
      0 => 'Termwind\\Laravel\\TermwindServiceProvider',
    ),
  ),
  'pestphp/pest-plugin-laravel' => 
  array (
    'providers' => 
    array (
      0 => 'Pest\\Laravel\\PestServiceProvider',
    ),
  ),
);
```

# bootstrap\cache\services.php

```php
<?php return array (
  'providers' => 
  array (
    0 => 'Illuminate\\Auth\\AuthServiceProvider',
    1 => 'Illuminate\\Broadcasting\\BroadcastServiceProvider',
    2 => 'Illuminate\\Bus\\BusServiceProvider',
    3 => 'Illuminate\\Cache\\CacheServiceProvider',
    4 => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    5 => 'Illuminate\\Concurrency\\ConcurrencyServiceProvider',
    6 => 'Illuminate\\Cookie\\CookieServiceProvider',
    7 => 'Illuminate\\Database\\DatabaseServiceProvider',
    8 => 'Illuminate\\Encryption\\EncryptionServiceProvider',
    9 => 'Illuminate\\Filesystem\\FilesystemServiceProvider',
    10 => 'Illuminate\\Foundation\\Providers\\FoundationServiceProvider',
    11 => 'Illuminate\\Hashing\\HashServiceProvider',
    12 => 'Illuminate\\Mail\\MailServiceProvider',
    13 => 'Illuminate\\Notifications\\NotificationServiceProvider',
    14 => 'Illuminate\\Pagination\\PaginationServiceProvider',
    15 => 'Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider',
    16 => 'Illuminate\\Pipeline\\PipelineServiceProvider',
    17 => 'Illuminate\\Queue\\QueueServiceProvider',
    18 => 'Illuminate\\Redis\\RedisServiceProvider',
    19 => 'Illuminate\\Session\\SessionServiceProvider',
    20 => 'Illuminate\\Translation\\TranslationServiceProvider',
    21 => 'Illuminate\\Validation\\ValidationServiceProvider',
    22 => 'Illuminate\\View\\ViewServiceProvider',
    23 => 'Inertia\\ServiceProvider',
    24 => 'Laravel\\Fortify\\FortifyServiceProvider',
    25 => 'Laravel\\Pail\\PailServiceProvider',
    26 => 'Laravel\\Sail\\SailServiceProvider',
    27 => 'Laravel\\Sanctum\\SanctumServiceProvider',
    28 => 'Laravel\\Tinker\\TinkerServiceProvider',
    29 => 'Laravel\\Wayfinder\\WayfinderServiceProvider',
    30 => 'Carbon\\Laravel\\ServiceProvider',
    31 => 'NunoMaduro\\Collision\\Adapters\\Laravel\\CollisionServiceProvider',
    32 => 'Termwind\\Laravel\\TermwindServiceProvider',
    33 => 'Pest\\Laravel\\PestServiceProvider',
    34 => 'App\\Providers\\AppServiceProvider',
    35 => 'App\\Providers\\FortifyServiceProvider',
  ),
  'eager' => 
  array (
    0 => 'Illuminate\\Auth\\AuthServiceProvider',
    1 => 'Illuminate\\Cookie\\CookieServiceProvider',
    2 => 'Illuminate\\Database\\DatabaseServiceProvider',
    3 => 'Illuminate\\Encryption\\EncryptionServiceProvider',
    4 => 'Illuminate\\Filesystem\\FilesystemServiceProvider',
    5 => 'Illuminate\\Foundation\\Providers\\FoundationServiceProvider',
    6 => 'Illuminate\\Notifications\\NotificationServiceProvider',
    7 => 'Illuminate\\Pagination\\PaginationServiceProvider',
    8 => 'Illuminate\\Session\\SessionServiceProvider',
    9 => 'Illuminate\\View\\ViewServiceProvider',
    10 => 'Inertia\\ServiceProvider',
    11 => 'Laravel\\Fortify\\FortifyServiceProvider',
    12 => 'Laravel\\Pail\\PailServiceProvider',
    13 => 'Laravel\\Sanctum\\SanctumServiceProvider',
    14 => 'Laravel\\Wayfinder\\WayfinderServiceProvider',
    15 => 'Carbon\\Laravel\\ServiceProvider',
    16 => 'NunoMaduro\\Collision\\Adapters\\Laravel\\CollisionServiceProvider',
    17 => 'Termwind\\Laravel\\TermwindServiceProvider',
    18 => 'Pest\\Laravel\\PestServiceProvider',
    19 => 'App\\Providers\\AppServiceProvider',
    20 => 'App\\Providers\\FortifyServiceProvider',
  ),
  'deferred' => 
  array (
    'Illuminate\\Broadcasting\\BroadcastManager' => 'Illuminate\\Broadcasting\\BroadcastServiceProvider',
    'Illuminate\\Contracts\\Broadcasting\\Factory' => 'Illuminate\\Broadcasting\\BroadcastServiceProvider',
    'Illuminate\\Contracts\\Broadcasting\\Broadcaster' => 'Illuminate\\Broadcasting\\BroadcastServiceProvider',
    'Illuminate\\Bus\\Dispatcher' => 'Illuminate\\Bus\\BusServiceProvider',
    'Illuminate\\Contracts\\Bus\\Dispatcher' => 'Illuminate\\Bus\\BusServiceProvider',
    'Illuminate\\Contracts\\Bus\\QueueingDispatcher' => 'Illuminate\\Bus\\BusServiceProvider',
    'Illuminate\\Bus\\BatchRepository' => 'Illuminate\\Bus\\BusServiceProvider',
    'Illuminate\\Bus\\DatabaseBatchRepository' => 'Illuminate\\Bus\\BusServiceProvider',
    'cache' => 'Illuminate\\Cache\\CacheServiceProvider',
    'cache.store' => 'Illuminate\\Cache\\CacheServiceProvider',
    'cache.psr6' => 'Illuminate\\Cache\\CacheServiceProvider',
    'memcached.connector' => 'Illuminate\\Cache\\CacheServiceProvider',
    'Illuminate\\Cache\\RateLimiter' => 'Illuminate\\Cache\\CacheServiceProvider',
    'Illuminate\\Foundation\\Console\\AboutCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Cache\\Console\\ClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Cache\\Console\\ForgetCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ClearCompiledCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Auth\\Console\\ClearResetsCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConfigCacheCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConfigClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConfigShowCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\DbCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\MonitorCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\PruneCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\ShowCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\TableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\WipeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\DownCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EnvironmentCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EnvironmentDecryptCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EnvironmentEncryptCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EventCacheCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EventClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EventListCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Concurrency\\Console\\InvokeSerializedClosureCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\KeyGenerateCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\OptimizeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\OptimizeClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\PackageDiscoverCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Cache\\Console\\PruneStaleTagsCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\ClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\ListFailedCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\FlushFailedCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\ForgetFailedCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\ListenCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\MonitorCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\PauseCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\PruneBatchesCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\PruneFailedJobsCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\RestartCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\ResumeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\RetryCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\RetryBatchCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\WorkCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ReloadCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\RouteCacheCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\RouteClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\RouteListCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\DumpCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Seeds\\SeedCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleFinishCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleListCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleRunCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleClearCacheCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleTestCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleWorkCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Console\\Scheduling\\ScheduleInterruptCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\ShowModelCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\StorageLinkCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\StorageUnlinkCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\UpCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ViewCacheCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ViewClearCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ApiInstallCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\BroadcastingInstallCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Cache\\Console\\CacheTableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\CastMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ChannelListCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ChannelMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ClassMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ComponentMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConfigMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConfigPublishCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ConsoleMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Routing\\Console\\ControllerMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\DocsCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EnumMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EventGenerateCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\EventMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ExceptionMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Factories\\FactoryMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\InterfaceMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\JobMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\JobMiddlewareMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\LangPublishCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ListenerMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\MailMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Routing\\Console\\MiddlewareMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ModelMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\NotificationMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Notifications\\Console\\NotificationTableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ObserverMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\PolicyMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ProviderMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\FailedTableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\TableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Queue\\Console\\BatchesTableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\RequestMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ResourceMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\RuleMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ScopeMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Seeds\\SeederMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Session\\Console\\SessionTableCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ServeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\StubPublishCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\TestMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\TraitMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\VendorPublishCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Foundation\\Console\\ViewMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'migrator' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'migration.repository' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'migration.creator' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Migrations\\Migrator' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\MigrateCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\FreshCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\InstallCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\RefreshCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\ResetCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\RollbackCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\StatusCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Database\\Console\\Migrations\\MigrateMakeCommand' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'composer' => 'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider',
    'Illuminate\\Concurrency\\ConcurrencyManager' => 'Illuminate\\Concurrency\\ConcurrencyServiceProvider',
    'hash' => 'Illuminate\\Hashing\\HashServiceProvider',
    'hash.driver' => 'Illuminate\\Hashing\\HashServiceProvider',
    'mail.manager' => 'Illuminate\\Mail\\MailServiceProvider',
    'mailer' => 'Illuminate\\Mail\\MailServiceProvider',
    'Illuminate\\Mail\\Markdown' => 'Illuminate\\Mail\\MailServiceProvider',
    'auth.password' => 'Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider',
    'auth.password.broker' => 'Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider',
    'Illuminate\\Contracts\\Pipeline\\Hub' => 'Illuminate\\Pipeline\\PipelineServiceProvider',
    'pipeline' => 'Illuminate\\Pipeline\\PipelineServiceProvider',
    'queue' => 'Illuminate\\Queue\\QueueServiceProvider',
    'queue.connection' => 'Illuminate\\Queue\\QueueServiceProvider',
    'queue.failer' => 'Illuminate\\Queue\\QueueServiceProvider',
    'queue.listener' => 'Illuminate\\Queue\\QueueServiceProvider',
    'queue.worker' => 'Illuminate\\Queue\\QueueServiceProvider',
    'redis' => 'Illuminate\\Redis\\RedisServiceProvider',
    'redis.connection' => 'Illuminate\\Redis\\RedisServiceProvider',
    'translator' => 'Illuminate\\Translation\\TranslationServiceProvider',
    'translation.loader' => 'Illuminate\\Translation\\TranslationServiceProvider',
    'validator' => 'Illuminate\\Validation\\ValidationServiceProvider',
    'validation.presence' => 'Illuminate\\Validation\\ValidationServiceProvider',
    'Illuminate\\Contracts\\Validation\\UncompromisedVerifier' => 'Illuminate\\Validation\\ValidationServiceProvider',
    'Laravel\\Sail\\Console\\InstallCommand' => 'Laravel\\Sail\\SailServiceProvider',
    'Laravel\\Sail\\Console\\PublishCommand' => 'Laravel\\Sail\\SailServiceProvider',
    'command.tinker' => 'Laravel\\Tinker\\TinkerServiceProvider',
  ),
  'when' => 
  array (
    'Illuminate\\Broadcasting\\BroadcastServiceProvider' => 
    array (
    ),
    'Illuminate\\Bus\\BusServiceProvider' => 
    array (
    ),
    'Illuminate\\Cache\\CacheServiceProvider' => 
    array (
    ),
    'Illuminate\\Foundation\\Providers\\ConsoleSupportServiceProvider' => 
    array (
    ),
    'Illuminate\\Concurrency\\ConcurrencyServiceProvider' => 
    array (
    ),
    'Illuminate\\Hashing\\HashServiceProvider' => 
    array (
    ),
    'Illuminate\\Mail\\MailServiceProvider' => 
    array (
    ),
    'Illuminate\\Auth\\Passwords\\PasswordResetServiceProvider' => 
    array (
    ),
    'Illuminate\\Pipeline\\PipelineServiceProvider' => 
    array (
    ),
    'Illuminate\\Queue\\QueueServiceProvider' => 
    array (
    ),
    'Illuminate\\Redis\\RedisServiceProvider' => 
    array (
    ),
    'Illuminate\\Translation\\TranslationServiceProvider' => 
    array (
    ),
    'Illuminate\\Validation\\ValidationServiceProvider' => 
    array (
    ),
    'Laravel\\Sail\\SailServiceProvider' => 
    array (
    ),
    'Laravel\\Tinker\\TinkerServiceProvider' => 
    array (
    ),
  ),
);
```

# bootstrap\providers.php

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\FortifyServiceProvider::class,
];

```

# components.json

```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
        "config": "",
        "css": "resources/css/app.css",
        "baseColor": "neutral",
        "cssVariables": true,
        "prefix": ""
    },
    "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "ui": "@/components/ui",
        "lib": "@/lib",
        "hooks": "@/hooks"
    },
    "iconLibrary": "lucide"
}

```

# database\.gitignore

```
*.sqlite*

```

# database\factories\UserFactory.php

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}

```

# database\migrations\0001_01_01_000000_create_users_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};

```

# database\migrations\0001_01_01_000001_create_cache_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration')->index();
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};

```

# database\migrations\0001_01_01_000002_create_jobs_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
    }
};

```

# database\migrations\2025_08_26_100418_add_two_factor_columns_to_users_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->after('password')->nullable();
            $table->text('two_factor_recovery_codes')->after('two_factor_secret')->nullable();
            $table->timestamp('two_factor_confirmed_at')->after('two_factor_recovery_codes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
            ]);
        });
    }
};

```

# database\migrations\2026_01_22_172737_create_assets_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('basename'); // file name with extension
            $table->string('filename'); // filename without extension
            $table->string('path');
            $table->string('extension');
            $table->integer('pages');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};

```

# database\migrations\2026_01_22_173144_create_print_jobs_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('print_jobs', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->string('customer_number');
      $table->string('customer_name')->index();
      $table->integer('total_price');
      $table->timestamp('paid_at')->nullable();

      // aggregate state (if all details are done, this one is done)
      $table->enum(
        'status',
        [
          'pending_payment',  // havent paid
          'pending', // already paid, printing not started yet
          'queued', // already paid, print on queue
          'running', // currently printing
          'completed',
          'partially_failed',
          'failed',
          'cancelled'
        ]
      );
      $table->timestamps();
    });

    Schema::create('print_job_details', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->foreignUuid('parent_id')->constrained('print_jobs')->onDelete('cascade');
      $table->foreignUuid('asset_id')->constrained('assets');

      $table->enum('print_color', ['color', 'bnw']);
      $table->integer('price');

      $table->enum('status', ['pending', 'queued', 'printing', 'completed', 'failed', 'cancelled'])->default('pending');
      $table->integer('priority')->default(0);

      $table->tinyInteger('attempts')->default(0); // track printing attempts, fails the job after certain amount

      $table->timestamp('locked_at')->nullable(); // when the item is get sent to the printer

      $table->timestamps();

      $table->index(['status', 'priority', 'created_at']);
    });

    Schema::create('print_job_status_logs', function (Blueprint $table) {
      $table->uuid('id')->primary();
      $table->foreignUuid('detail_id')->constrained('print_job_details');
      $table->string('status');
      $table->text('message')->nullable();
      $table->timestamp('created_at')->useCurrent();
    });
  }
  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('print_job_status_logs');
    Schema::dropIfExists('print_job_details');
    Schema::dropIfExists('print_jobs');
  }
};

```

# database\migrations\2026_01_22_192755_create_personal_access_tokens_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};

```

# database\migrations\2026_01_23_060200_create_printer_info_table.php

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('printer_info', function (Blueprint $table) {
            $table->id();
            $table->sting("name");
            $table->integer("paper_remaining");
            $table->enum("status", ["ready", "offline", "busy"]);
            $table->boolean('primary')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('printer_info');
    }
};

```

# database\seeders\DatabaseSeeder.php

```php
<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}

```

# eslint.config.js

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        ...importPlugin.flatConfigs.recommended,
        settings: {
            'import/resolver': {
                typescript: true,
                node: true,
            },
        },
        rules: {
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
        },
    },
    {
        ...importPlugin.flatConfigs.typescript,
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
        },
    },
    {
        ignores: ['vendor', 'node_modules', 'public', 'bootstrap/ssr', 'tailwind.config.js', 'vite.config.ts'],
    },
    prettier, // Turn off all rules that might conflict with Prettier
];

```

# package.json

```json
{
    "$schema": "https://www.schemastore.org/package.json",
    "private": true,
    "type": "module",
    "scripts": {
        "build": "vite build",
        "build:ssr": "vite build && vite build --ssr",
        "dev": "vite",
        "format": "prettier --write resources/",
        "format:check": "prettier --check resources/",
        "lint": "eslint . --fix",
        "types": "tsc --noEmit"
    },
    "devDependencies": {
        "@eslint/js": "^9.19.0",
        "@laravel/vite-plugin-wayfinder": "^0.1.3",
        "@types/node": "^22.13.5",
        "babel-plugin-react-compiler": "^1.0.0",
        "eslint": "^9.17.0",
        "eslint-config-prettier": "^10.0.1",
        "eslint-import-resolver-typescript": "^4.4.4",
        "eslint-plugin-import": "^2.32.0",
        "eslint-plugin-react": "^7.37.3",
        "eslint-plugin-react-hooks": "^7.0.0",
        "prettier": "^3.4.2",
        "prettier-plugin-organize-imports": "^4.1.0",
        "prettier-plugin-tailwindcss": "^0.6.11",
        "typescript-eslint": "^8.23.0"
    },
    "dependencies": {
        "@headlessui/react": "^2.2.0",
        "@inertiajs/react": "^2.3.7",
        "@radix-ui/react-avatar": "^1.1.3",
        "@radix-ui/react-checkbox": "^1.1.4",
        "@radix-ui/react-collapsible": "^1.1.3",
        "@radix-ui/react-dialog": "^1.1.6",
        "@radix-ui/react-dropdown-menu": "^2.1.6",
        "@radix-ui/react-label": "^2.1.8",
        "@radix-ui/react-navigation-menu": "^1.2.5",
        "@radix-ui/react-select": "^2.1.6",
        "@radix-ui/react-separator": "^1.1.8",
        "@radix-ui/react-slot": "^1.2.3",
        "@radix-ui/react-tabs": "^1.1.13",
        "@radix-ui/react-toggle": "^1.1.2",
        "@radix-ui/react-toggle-group": "^1.1.2",
        "@radix-ui/react-tooltip": "^1.1.8",
        "@tailwindcss/vite": "^4.1.11",
        "@tanstack/react-table": "^8.21.3",
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        "@vitejs/plugin-react": "^5.0.0",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "concurrently": "^9.0.1",
        "globals": "^15.14.0",
        "input-otp": "^1.4.2",
        "laravel-vite-plugin": "^2.0",
        "lucide-react": "^0.475.0",
        "react": "^19.2.0",
        "react-dom": "^19.2.0",
        "tailwind-merge": "^3.0.1",
        "tailwindcss": "^4.0.0",
        "tw-animate-css": "^1.4.0",
        "typescript": "^5.7.2",
        "vite": "^7.0.4"
    },
    "optionalDependencies": {
        "@rollup/rollup-linux-x64-gnu": "4.9.5",
        "@rollup/rollup-win32-x64-msvc": "4.9.5",
        "@tailwindcss/oxide-linux-x64-gnu": "^4.0.1",
        "@tailwindcss/oxide-win32-x64-msvc": "^4.0.1",
        "lightningcss-linux-x64-gnu": "^1.29.1",
        "lightningcss-win32-x64-msvc": "^1.29.1"
    }
}

```

# phpunit.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="APP_MAINTENANCE_DRIVER" value="file"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="BROADCAST_CONNECTION" value="null"/>
        <env name="CACHE_STORE" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="PULSE_ENABLED" value="false"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
        <env name="NIGHTWATCH_ENABLED" value="false"/>
    </php>
</phpunit>

```

# pint.json

```json
{
    "preset": "laravel"
}

```

# public\.htaccess

```
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Handle X-XSRF-Token Header
    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

```

# public\apple-touch-icon.png

This is a binary file of the type: Image

# public\favicon.ico

This is a binary file of the type: Binary

# public\favicon.svg

This is a file of the type: SVG Image

# public\index.php

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());

```

# public\logo.svg

This is a file of the type: SVG Image

# public\robots.txt

```txt
User-agent: *
Disallow:

```

# routes\api.php

```php
<?php

use App\Http\Controllers\Api\PrinterWebhookController;
use App\Http\Controllers\PrintJobController;
use App\Http\Controllers\PrinterController;
use Illuminate\Support\Facades\Route;

// Create a new order
Route::post('/print-job', [PrintJobController::class, 'store'])->name('print-jobs.store');

// Get a specific print job
Route::get('/print-job/{printJob}', [PrintJobController::class, 'show'])->name('print-jobs.show');

// TODO : dummy routes!! disable this on prod
// Mark order as paid
Route::post('/print-job/{printJob}/pay', [PrintJobController::class, 'simulatePayment'])->name('print-jobs.simulatePayment');
Route::post('/print-job/{printJob}/cancel', [PrintJobController::class, 'cancelPrintJob'])->name('print-jobs.cancelPrintJob');

// Dispatch print job
Route::post('/print-job/{printJob}/dispatch', [PrintJobController::class, 'dispatchJob'])
  ->name('print-jobs.dispatch');

// Get printer list
Route::get('/printers', [PrinterController::class, 'index'])->name('printers.index');

Route::post('/printer/webhook', [PrinterWebhookController::class, 'handle'])
  ->name('api.printer.webhook');

```

# routes\console.php

```php
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

```

# routes\settings.php

```php
<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});

```

# routes\web.php

```php
<?php

use App\Http\Controllers\HistoryController;
use App\Http\Controllers\PrintJobController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\QueueController;

Route::get('/', function () {
  return Inertia::render('welcome', [
    'canRegister' => Features::enabled(Features::registration()),
  ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
  Route::get('dashboard', function () {
    return Inertia::render('dashboard');
  })->name('dashboard');

  Route::get('config', function () {
    return Inertia::render('config');
  })->name('config');

  Route::get(
    'print-job/{id}',
    [PrintJobController::class, 'show']
  )->name('printJob.detail');

  Route::get('/queue', [QueueController::class, 'index'])->name('queue');
  Route::get('/history', [HistoryController::class, 'index'])->name('history');
  // Route::get('/history', [HistoryController::class, 'index'])->name('history');
});

require __DIR__ . '/settings.php';

```

# tsconfig.json

```json
{
    "compilerOptions": {
        /* Visit https://aka.ms/tsconfig to read more about this file */

        /* Projects */
        // "incremental": true,                              /* Save .tsbuildinfo files to allow for incremental compilation of projects. */
        // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
        // "tsBuildInfoFile": "./.tsbuildinfo",              /* Specify the path to .tsbuildinfo incremental compilation file. */
        // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects. */
        // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
        // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */

        /* Language and Environment */
        "target": "ESNext" /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */,
        // "lib": [],                                        /* Specify a set of bundled library declaration files that describe the target runtime environment. */
        // "jsx": "preserve",                                /* Specify what JSX code is generated. */
        // "experimentalDecorators": true,                   /* Enable experimental support for legacy experimental decorators. */
        // "emitDecoratorMetadata": true,                    /* Emit design-type metadata for decorated declarations in source files. */
        // "jsxFactory": "",                                 /* Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h'. */
        // "jsxFragmentFactory": "",                         /* Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'. */
        // "jsxImportSource": "",                            /* Specify module specifier used to import the JSX factory functions when using 'jsx: react-jsx*'. */
        // "reactNamespace": "",                             /* Specify the object invoked for 'createElement'. This only applies when targeting 'react' JSX emit. */
        // "noLib": true,                                    /* Disable including any library files, including the default lib.d.ts. */
        // "useDefineForClassFields": true,                  /* Emit ECMAScript-standard-compliant class fields. */
        // "moduleDetection": "auto",                        /* Control what method is used to detect module-format JS files. */

        /* Modules */
        "module": "ESNext" /* Specify what module code is generated. */,
        // "rootDir": "./",                                  /* Specify the root folder within your source files. */
        "moduleResolution": "bundler" /* Specify how TypeScript looks up a file from a given module specifier. */,
        // "baseUrl": "./",                                  /* Specify the base directory to resolve non-relative module names. */
        // "paths": {},                                      /* Specify a set of entries that re-map imports to additional lookup locations. */
        // "rootDirs": [],                                   /* Allow multiple folders to be treated as one when resolving modules. */
        // "typeRoots": [],                                  /* Specify multiple folders that act like './node_modules/@types'. */
        // "types": [],                                      /* Specify type package names to be included without being referenced in a source file. */
        // "allowUmdGlobalAccess": true,                     /* Allow accessing UMD globals from modules. */
        // "moduleSuffixes": [],                             /* List of file name suffixes to search when resolving a module. */
        // "allowImportingTsExtensions": true,               /* Allow imports to include TypeScript file extensions. Requires '--moduleResolution bundler' and either '--noEmit' or '--emitDeclarationOnly' to be set. */
        // "rewriteRelativeImportExtensions": true,          /* Rewrite '.ts', '.tsx', '.mts', and '.cts' file extensions in relative import paths to their JavaScript equivalent in output files. */
        // "resolvePackageJsonExports": true,                /* Use the package.json 'exports' field when resolving package imports. */
        // "resolvePackageJsonImports": true,                /* Use the package.json 'imports' field when resolving imports. */
        // "customConditions": [],                           /* Conditions to set in addition to the resolver-specific defaults when resolving imports. */
        // "noUncheckedSideEffectImports": true,             /* Check side effect imports. */
        // "resolveJsonModule": true,                        /* Enable importing .json files. */
        // "allowArbitraryExtensions": true,                 /* Enable importing files with any extension, provided a declaration file is present. */
        // "noResolve": true,                                /* Disallow 'import's, 'require's or '<reference>'s from expanding the number of files TypeScript should add to a project. */

        /* JavaScript Support */
        "allowJs": true /* Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. */,
        // "checkJs": true,                                  /* Enable error reporting in type-checked JavaScript files. */
        // "maxNodeModuleJsDepth": 1,                        /* Specify the maximum folder depth used for checking JavaScript files from 'node_modules'. Only applicable with 'allowJs'. */

        /* Emit */
        // "declaration": true,                              /* Generate .d.ts files from TypeScript and JavaScript files in your project. */
        // "declarationMap": true,                           /* Create sourcemaps for d.ts files. */
        // "emitDeclarationOnly": true,                      /* Only output d.ts files and not JavaScript files. */
        // "sourceMap": true,                                /* Create source map files for emitted JavaScript files. */
        // "inlineSourceMap": true,                          /* Include sourcemap files inside the emitted JavaScript. */
        "noEmit": true /* Disable emitting files from a compilation. */,
        // "outFile": "./",                                  /* Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output. */
        // "outDir": "./",                                   /* Specify an output folder for all emitted files. */
        // "removeComments": true,                           /* Disable emitting comments. */
        // "importHelpers": true,                            /* Allow importing helper functions from tslib once per project, instead of including them per-file. */
        // "downlevelIteration": true,                       /* Emit more compliant, but verbose and less performant JavaScript for iteration. */
        // "sourceRoot": "",                                 /* Specify the root path for debuggers to find the reference source code. */
        // "mapRoot": "",                                    /* Specify the location where debugger should locate map files instead of generated locations. */
        // "inlineSources": true,                            /* Include source code in the sourcemaps inside the emitted JavaScript. */
        // "emitBOM": true,                                  /* Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files. */
        // "newLine": "crlf",                                /* Set the newline character for emitting files. */
        // "stripInternal": true,                            /* Disable emitting declarations that have '@internal' in their JSDoc comments. */
        // "noEmitHelpers": true,                            /* Disable generating custom helper functions like '__extends' in compiled output. */
        // "noEmitOnError": true,                            /* Disable emitting files if any type checking errors are reported. */
        // "preserveConstEnums": true,                       /* Disable erasing 'const enum' declarations in generated code. */
        // "declarationDir": "./",                           /* Specify the output directory for generated declaration files. */

        /* Interop Constraints */
        "isolatedModules": true /* Ensure that each file can be safely transpiled without relying on other imports. */,
        // "verbatimModuleSyntax": true,                     /* Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the 'module' setting. */
        // "isolatedDeclarations": true,                     /* Require sufficient annotation on exports so other tools can trivially generate declaration files. */
        // "allowSyntheticDefaultImports": true,             /* Allow 'import x from y' when a module doesn't have a default export. */
        "esModuleInterop": true /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */,
        // "preserveSymlinks": true,                         /* Disable resolving symlinks to their realpath. This correlates to the same flag in node. */
        "forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,

        /* Type Checking */
        "strict": true /* Enable all strict type-checking options. */,
        "noImplicitAny": true /* Enable error reporting for expressions and declarations with an implied 'any' type. */,
        // "strictNullChecks": true,                         /* When type checking, take into account 'null' and 'undefined'. */
        // "strictFunctionTypes": true,                      /* When assigning functions, check to ensure parameters and the return values are subtype-compatible. */
        // "strictBindCallApply": true,                      /* Check that the arguments for 'bind', 'call', and 'apply' methods match the original function. */
        // "strictPropertyInitialization": true,             /* Check for class properties that are declared but not set in the constructor. */
        // "strictBuiltinIteratorReturn": true,              /* Built-in iterators are instantiated with a 'TReturn' type of 'undefined' instead of 'any'. */
        // "noImplicitThis": true,                           /* Enable error reporting when 'this' is given the type 'any'. */
        // "useUnknownInCatchVariables": true,               /* Default catch clause variables as 'unknown' instead of 'any'. */
        // "alwaysStrict": true,                             /* Ensure 'use strict' is always emitted. */
        // "noUnusedLocals": true,                           /* Enable error reporting when local variables aren't read. */
        // "noUnusedParameters": true,                       /* Raise an error when a function parameter isn't read. */
        // "exactOptionalPropertyTypes": true,               /* Interpret optional property types as written, rather than adding 'undefined'. */
        // "noImplicitReturns": true,                        /* Enable error reporting for codepaths that do not explicitly return in a function. */
        // "noFallthroughCasesInSwitch": true,               /* Enable error reporting for fallthrough cases in switch statements. */
        // "noUncheckedIndexedAccess": true,                 /* Add 'undefined' to a type when accessed using an index. */
        // "noImplicitOverride": true,                       /* Ensure overriding members in derived classes are marked with an override modifier. */
        // "noPropertyAccessFromIndexSignature": true,       /* Enforces using indexed accessors for keys declared using an indexed type. */
        // "allowUnusedLabels": true,                        /* Disable error reporting for unused labels. */
        // "allowUnreachableCode": true,                     /* Disable error reporting for unreachable code. */

        /* Completeness */
        // "skipDefaultLibCheck": true,                      /* Skip type checking .d.ts files that are included with TypeScript. */
        "skipLibCheck": true /* Skip type checking all .d.ts files. */,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./resources/js/*"]
        },
        "jsx": "react-jsx"
    },
    "include": ["resources/js/**/*.ts", "resources/js/**/*.d.ts", "resources/js/**/*.tsx"]
}

```

# vite.config.ts

```ts
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});

```

