<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\PrintJobDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class EditRequestController extends Controller
{

  // mark a print job as done
  public function markAsDone(Request $request, PrintJobDetail $printJob)
  {
    try {
      $printJob->update([
        'status' => 'pending'
      ]);

      $printJob->job->updateAggregatedStatus();

    } catch (Throwable $e) {
      Log::error("Trying to mark edit request as done failed: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
      return back()->with('error', 'An error occurred while updating the job: ' . $e->getMessage());
    }

    return redirect()->back()->with('success', 'File uploaded and job updated successfully.');
  }

  public function upload(Request $request, PrintJobDetail $detail)
  {
    $pageRangeRule = function ($attribute, $value, $fail) {
      if (!$value) return;
      foreach (explode(',', $value) as $part) {
        $part = trim($part);
        if (!preg_match('/^[1-9]\d*(-[1-9]\d*)?$/', $part)) {
          return $fail($attribute . ' contains an invalid format.');
        }
        if (str_contains($part, '-')) {
          list($start, $end) = explode('-', $part);
          if (intval($start) >= intval($end)) {
            return $fail($attribute . ' has an invalid range.');
          }
        }
      }
    };

    $validated = $request->validate([
      'file' => ['required', 'file'],
      'print_color' => ['required', 'in:bnw,color'],
      'copies' => ['required', 'integer', 'min:1'],
      'pages_to_print' => ['nullable', 'string'],
    ]);


    if ($detail->status !== 'request_edit') {
      return back()->with('error', 'This item is not awaiting an edit.');
    }

    try {
      DB::transaction(function () use ($detail, $validated, $request) {
        $uploadedFile = $request->file('file');

        $detectionData = $this->callColorServer(
          $uploadedFile->getRealPath(),
          $uploadedFile->getClientOriginalName()
        );

        $totalPages = $detectionData['total_pages'];


        $effectivePages = $this->getEffectivePageNumbers(
          $validated['pages_to_print'],
          $detectionData['total_pages']
        );

        $recalculatedPrice = $this->calculateDynamicPrice(
          $detectionData,
          $effectivePages,
          $validated['print_color'],
          $validated['copies']
        );


        $path = $uploadedFile->store('print_uploads', 'local');
        $asset = Asset::create([
          'basename' => $uploadedFile->getClientOriginalName(),
          'filename' => pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_FILENAME),
          'path' => $path,
          'extension' => $uploadedFile->extension(),
          'pages' => $totalPages,
        ]);

        $detail->update([
          'modified_asset_id' => $asset->id,
          'price' => $recalculatedPrice,
          'print_color' => $validated['print_color'],
          'copies' => $validated['copies'],
          'pages_to_print' => $validated['pages_to_print'] == '1-1' ? null : $validated['pages_to_print'],
          'paper_count' => $this->getEffectivePageNumbers($validated['pages_to_print'], $totalPages)->count() * $validated['copies'],
        ]);

        $detail->logs()->create([
          'status' => 'request_edit',
          'message' => 'New file uploaded by admin with updated settings. Awaiting payment.'
        ]);

        $parentPrint = $detail->job;

        $parentPrint->update([
          'total_price' => $parentPrint->details()->sum('price'),
          'total_pages' => $parentPrint->details()->sum('paper_count'),
        ]);
        $parentPrint->updateAggregatedStatus();
      });
    } catch (Throwable $e) {
      Log::error("Edit Request Upload Failed: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
      return back()->with('error', 'An error occurred while updating the job: ' . $e->getMessage());
    }

    return redirect()->back()->with('success', 'File uploaded and job updated successfully.');
  }

  // calculate price based on the parameter like color and copies
  private function calculateDynamicPrice(
    array                          $detectionData,
    \Illuminate\Support\Collection $effectivePages,
    string                         $printColor,
    int                            $copies
  ): int
  {
    $colorsByPage = collect($detectionData['colors'])->keyBy('page');

    $total = $effectivePages->reduce(function ($carry, $page) use ($colorsByPage, $printColor) {

      $pageInfo = $colorsByPage->get($page);

      if (!$pageInfo) {
        return $carry;
      }

      if ($printColor === 'bnw') {
        return $carry + GetConfigs::bnw();
      }

      return $carry + ($pageInfo['price'] ?? GetConfigs::bnw());

    }, 0);

    return $total * $copies;
  }

  // helper code to parse page
  private function getEffectivePageNumbers(?string $rangeStr, int $totalFilePages): \Illuminate\Support\Collection
  {
    if (empty($rangeStr)) {
      return collect(range(1, $totalFilePages));
    }
    $pages = collect();
    foreach (explode(',', $rangeStr) as $part) {
      $part = trim($part);
      if (str_contains($part, '-')) {
        [$start, $end] = explode('-', $part);
        if (is_numeric($start) && is_numeric($end) && $end >= $start) {
          for ($i = $start; $i <= $end; $i++) {
            if ($i <= $totalFilePages) $pages->push($i);
          }
        }
      } else {
        if (is_numeric($part) && $part <= $totalFilePages) $pages->push((int)$part);
      }
    }
    return $pages->unique()->sort();
  }


  // Method for the api so the frontend get the pricing through the laravel server
  public function getPricing(Request $request)
  {
    $validated = $request->validate([
      'file' => ['required', 'file'],
      'print_color' => ['required', 'in:bnw,color'],
      'copies' => ['required', 'integer', 'min:1'],
      'pages_to_print' => ['nullable', 'string'],
    ]);

    try {
      $file = $request->file('file');

      $detectionData = $this->callColorServer(
        $file->getRealPath(),
        $file->getClientOriginalName()
      );

      $effectivePages = $this->getEffectivePageNumbers(
        $validated['pages_to_print'],
        $detectionData['total_pages']
      );

      $price = $this->calculateDynamicPrice(
        $detectionData,
        $effectivePages,
        $validated['print_color'],
        $validated['copies']
      );

      return response()->json([
        'success' => true,
        'total_pages' => $detectionData['total_pages'],
        'colors' => $detectionData['colors'],
        'price' => $price,
        'paper_count' => $effectivePages->count() * $validated['copies'],
      ]);

    } catch (\Throwable $e) {
      Log::error("Pricing preview failed: " . $e->getMessage());

      return response()->json([
        'success' => false,
        'message' => 'Failed to calculate pricing.'
      ], 500);
    }
  }


  private function callColorServer($filePath, $originalName)
  {
    $endpoint = GetConfigs::colorServEndpoint();

    if (!$endpoint) {
      throw new \Exception('Color server endpoint not configured.');
    }

    $response = Http::timeout(30)
      ->attach('files', file_get_contents($filePath), $originalName)
      ->post($endpoint);

    if (!$response->successful()) {
      throw new \Exception('Color server request failed.');
    }

    $json = $response->json();

    if (($json['success'] ?? null) !== 'true' || empty($json['data'][0])) {
      throw new \Exception('Invalid response from color server.');
    }

    return $json['data'][0];

  }
}