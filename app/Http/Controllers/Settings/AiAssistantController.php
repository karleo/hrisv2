<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AiAssistantUpdateRequest;
use App\Http\Requests\Settings\TestAiAssistantConnectionRequest;
use App\Models\AiAssistantSetting;
use App\Services\EmployeeAssistant\AiAssistantSettingsManager;
use App\Services\EmployeeAssistant\EmployeeAssistantService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class AiAssistantController extends Controller
{
    /**
     * @var list<string>
     */
    private const MODEL_OPTIONS = [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4.1-mini',
        'gpt-4.1',
    ];

    public function edit(Request $request, AiAssistantSettingsManager $settingsManager): Response
    {
        $this->ensureAdministrator($request);

        $settings = AiAssistantSetting::singleton();
        $resolved = $settingsManager->resolved();

        return Inertia::render('settings/ai-assistant', [
            'settings' => [
                'enabled' => $resolved['enabled'],
                'provider' => $resolved['provider'],
                'model' => $resolved['openai']['model'],
                'base_url' => $resolved['openai']['base_url'],
                'max_history' => $resolved['max_history'],
                'rate_limit' => $resolved['rate_limit'],
                'has_api_key' => trim((string) ($resolved['openai']['api_key'] ?? '')) !== '',
                'last_tested_at' => $settings?->last_tested_at?->toIso8601String(),
                'last_test_status' => $settings?->last_test_status,
                'last_test_message' => $settings?->safeLastTestMessage(),
                'source' => $resolved['source'],
            ],
            'modelOptions' => self::MODEL_OPTIONS,
            'refreshInstructions' => [
                'Database settings take effect immediately for new assistant requests.',
                'If config is cached in production, run `php artisan config:clear` after changing .env fallback values.',
            ],
        ]);
    }

    public function update(
        AiAssistantUpdateRequest $request,
        AiAssistantSettingsManager $settingsManager,
    ): RedirectResponse {
        $this->ensureAdministrator($request);

        $validated = $request->validated();

        $settings = AiAssistantSetting::singletonOrCreate([
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'base_url' => 'https://api.openai.com/v1',
            'max_history' => 20,
            'rate_limit' => 20,
        ]);

        $settings->fill([
            'enabled' => (bool) $validated['enabled'],
            'provider' => (string) $validated['provider'],
            'model' => (string) $validated['model'],
            'base_url' => $validated['base_url'] ?: 'https://api.openai.com/v1',
            'max_history' => (int) $validated['max_history'],
            'rate_limit' => (int) $validated['rate_limit'],
            'updated_by' => $request->user()->id,
        ]);

        if (array_key_exists('api_key', $validated) && is_string($validated['api_key']) && $validated['api_key'] !== '') {
            $settings->api_key = $validated['api_key'];
        }

        $settings->save();
        $settingsManager->forgetCache();

        return to_route('ai-assistant.edit')->with('success', 'Employee assistant settings updated successfully.');
    }

    public function test(
        TestAiAssistantConnectionRequest $request,
        AiAssistantSettingsManager $settingsManager,
        EmployeeAssistantService $assistantService,
    ): RedirectResponse {
        $this->ensureAdministrator($request);

        $validated = $request->validated();
        $settings = AiAssistantSetting::singletonOrCreate([
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
        ]);

        if (! array_key_exists('api_key', $validated) || ! is_string($validated['api_key']) || $validated['api_key'] === '') {
            $validated['api_key'] = $settings->api_key ?? $settingsManager->resolved()['openai']['api_key'];
        }

        try {
            if (! (bool) $validated['enabled']) {
                throw new RuntimeException('Enable the assistant before running a connection test.');
            }

            $reply = $assistantService->testConnection(
                $validated,
                (string) ($validated['test_message'] ?? 'Reply with exactly: OK'),
            );

            $settings->forceFill([
                'last_tested_at' => Carbon::now(),
                'last_test_status' => 'success',
                'last_test_message' => mb_substr($reply, 0, 500),
                'updated_by' => $request->user()->id,
            ])->save();

            Log::info('ai_assistant.test.success', [
                'user_id' => $request->user()->id,
            ]);

            $settingsManager->forgetCache();

            return to_route('ai-assistant.edit')->with('success', 'OpenAI connection test succeeded.');
        } catch (Throwable $exception) {
            $settings->forceFill([
                'last_tested_at' => Carbon::now(),
                'last_test_status' => 'failed',
                'last_test_message' => mb_substr($exception->getMessage(), 0, 500),
                'updated_by' => $request->user()->id,
            ])->save();

            Log::warning('ai_assistant.test.failed', [
                'user_id' => $request->user()->id,
                'error' => $exception->getMessage(),
            ]);

            $settingsManager->forgetCache();

            return to_route('ai-assistant.edit')->withErrors([
                'test_message' => 'Connection test failed: '.$exception->getMessage(),
            ]);
        }
    }

    private function ensureAdministrator(Request $request): void
    {
        $user = $request->user();

        if ($user === null || ! $user->isAdministrator()) {
            abort(403);
        }
    }
}
