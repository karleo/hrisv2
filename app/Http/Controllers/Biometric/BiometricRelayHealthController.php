<?php

namespace App\Http\Controllers\Biometric;

use App\Http\Controllers\Controller;
use App\Services\Biometric\BiometricRelayStatusStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BiometricRelayHealthController extends Controller
{
    public function __construct(
        private readonly BiometricRelayStatusStore $statusStore,
    ) {}

    public function health(Request $request): JsonResponse
    {
        if (! $this->tokenIsValid($request)) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized'], 401);
        }

        $status = $this->statusStore->get();

        return response()->json([
            'ok' => true,
            'service' => 'hris-biometric-relay',
            'relay' => $status,
        ]);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        if (! $this->tokenIsValid($request)) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'serial_number' => ['nullable', 'string', 'max:64'],
            'last_relay_at' => ['nullable', 'string', 'max:64'],
            'last_successful_upload_at' => ['nullable', 'string', 'max:64'],
            'pending_retries' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string', 'max:64'],
            'punches_pulled' => ['nullable', 'integer', 'min:0'],
            'punches_relayed' => ['nullable', 'integer', 'min:0'],
            'failures' => ['nullable', 'integer', 'min:0'],
            'watermark' => ['nullable', 'string', 'max:64'],
        ]);

        $stored = $this->statusStore->put($validated);

        return response()->json([
            'ok' => true,
            'relay' => $stored,
        ]);
    }

    private function tokenIsValid(Request $request): bool
    {
        $expected = (string) config('biometric.relay_token', '');

        if ($expected === '') {
            return false;
        }

        $provided = (string) (
            $request->bearerToken()
            ?: $request->header('X-Biometric-Relay-Token', '')
        );

        return hash_equals($expected, $provided);
    }
}
