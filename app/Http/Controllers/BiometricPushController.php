<?php

namespace App\Http\Controllers;

use App\Models\BiometricSetting;
use App\Services\BiometricPushIngestionService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class BiometricPushController extends Controller
{
    public function handshake(Request $request): Response
    {
        $settings = BiometricSetting::current();
        if (! $this->isAuthorized($request, $settings)) {
            return response('ERROR', 403);
        }

        return response('OK', 200);
    }

    public function cdata(Request $request, BiometricPushIngestionService $ingestionService): Response
    {
        $settings = BiometricSetting::current();
        if (! $this->isAuthorized($request, $settings)) {
            return response('ERROR', 403);
        }

        try {
            $ingestionService->ingest($request);
        } catch (Throwable) {
            return response('ERROR', 500);
        }

        return response('OK', 200);
    }

    private function isAuthorized(Request $request, BiometricSetting $settings): bool
    {
        if (! $settings->is_enabled) {
            return false;
        }

        $commKey = trim((string) ($settings->comm_key ?? ''));
        if ($commKey === '') {
            return true;
        }

        $candidates = array_filter([
            $request->query('key'),
            $request->query('Key'),
            $request->query('KEY'),
            $request->header('X-ZKTeco-Key'),
        ], fn ($value): bool => is_string($value) && trim($value) !== '');

        foreach ($candidates as $candidate) {
            if (hash_equals($commKey, trim((string) $candidate))) {
                return true;
            }
        }

        return false;
    }
}
