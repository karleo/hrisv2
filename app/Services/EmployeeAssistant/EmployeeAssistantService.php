<?php

namespace App\Services\EmployeeAssistant;

use App\Models\Employee;
use App\Models\EmployeeAssistantConversation;
use App\Models\EmployeeAssistantMessage;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class EmployeeAssistantService
{
    public function __construct(
        private readonly EmployeeContextBuilder $contextBuilder,
        private readonly AiAssistantSettingsManager $settingsManager,
    ) {}

    /**
     * @return array{
     *     conversation: array{id: int, title: string|null, updated_at: string},
     *     user_message: array{id: int, role: string, content: string, created_at: string},
     *     assistant_message: array{id: int, role: string, content: string, created_at: string},
     * }
     */
    public function sendMessage(User $user, string $content, ?int $conversationId = null): array
    {
        $this->assertAssistantAvailable();

        $employee = $user->employee;
        if ($employee === null || ! $user->isAccountActive()) {
            throw new RuntimeException('You must have a linked employee profile to use the assistant.');
        }

        $conversation = $this->resolveConversation($employee, $conversationId);
        $context = $this->contextBuilder->buildForEmployee($employee);

        $userMessage = EmployeeAssistantMessage::query()->create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $content,
        ]);

        if ($conversation->title === null) {
            $conversation->update([
                'title' => Str::limit(trim($content), 60),
            ]);
        }

        $history = $this->conversationHistory($conversation);

        try {
            $assistantContent = $this->callOpenAi($context, $history);
        } catch (RuntimeException $exception) {
            $userMessage->delete();

            if ($conversation->messages()->doesntExist()) {
                $conversation->delete();
            }

            throw $exception;
        }

        $assistantMessage = EmployeeAssistantMessage::query()->create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $assistantContent,
        ]);

        $conversation->touch();

        return [
            'conversation' => $this->conversationPayload($conversation->fresh()),
            'user_message' => $this->messagePayload($userMessage),
            'assistant_message' => $this->messagePayload($assistantMessage),
        ];
    }

    public function isConfigured(): bool
    {
        return $this->settingsManager->isConfigured();
    }

    public function assertAssistantAvailable(): void
    {
        if (! $this->settingsManager->isEnabled()) {
            throw new RuntimeException('The employee assistant is currently disabled.');
        }

        if (! $this->isConfigured()) {
            throw new RuntimeException('The employee assistant is not configured. Please contact HR or IT support.');
        }
    }

    /**
     * @return array{
     *     enabled: bool,
     *     provider: string,
     *     openai: array{api_key: string, model: string, base_url: string},
     *     max_history: int,
     *     rate_limit: int,
     *     source: string,
     * }
     */
    public function resolvedSettings(): array
    {
        return $this->settingsManager->resolved();
    }

    /**
     * @param  array<string, mixed>  $override
     */
    public function testConnection(array $override, string $testMessage): string
    {
        $settings = $this->settingsManager->resolvedWithOverride($override);

        if (! ($settings['enabled'] ?? false)) {
            throw new RuntimeException('The employee assistant is currently disabled.');
        }

        if (! is_string($settings['openai']['api_key'] ?? null) || trim((string) $settings['openai']['api_key']) === '') {
            throw new RuntimeException('An OpenAI API key is required.');
        }

        $response = Http::withToken((string) $settings['openai']['api_key'])
            ->acceptJson()
            ->timeout(60)
            ->post(rtrim((string) $settings['openai']['base_url'], '/').'/chat/completions', [
                'model' => $settings['openai']['model'],
                'messages' => [
                    ['role' => 'user', 'content' => $testMessage],
                ],
                'max_tokens' => 32,
                'temperature' => 0,
            ]);

        if (! $response->successful()) {
            $providerError = data_get($response->json(), 'error.message');

            throw new RuntimeException($this->openAiErrorMessage(
                $response->status(),
                is_string($providerError) ? $providerError : null,
            ));
        }

        $content = data_get($response->json(), 'choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('The assistant returned an empty response.');
        }

        return trim($content);
    }

    private function resolveConversation(
        Employee $employee,
        ?int $conversationId,
    ): EmployeeAssistantConversation {
        if ($conversationId !== null && $conversationId > 0) {
            return EmployeeAssistantConversation::query()
                ->whereKey($conversationId)
                ->where('employee_id', $employee->id)
                ->firstOrFail();
        }

        return EmployeeAssistantConversation::query()->create([
            'employee_id' => $employee->id,
            'title' => null,
        ]);
    }

    /**
     * @return list<array{role: string, content: string}>
     */
    private function conversationHistory(EmployeeAssistantConversation $conversation): array
    {
        $settings = $this->settingsManager->resolved();
        $maxHistory = max(1, (int) ($settings['max_history'] ?? 20));

        return EmployeeAssistantMessage::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('id')
            ->limit($maxHistory)
            ->get(['role', 'content'])
            ->reverse()
            ->values()
            ->map(static fn (EmployeeAssistantMessage $message): array => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->all();
    }

    /**
     * @param  array<string, mixed>  $context
     * @param  list<array{role: string, content: string}>  $history
     */
    private function callOpenAi(array $context, array $history): string
    {
        $companyName = (string) ($context['profile']['company'] ?? config('app.name'));

        $systemPrompt = <<<PROMPT
You are the HRIS Employee Assistant for {$companyName}.

Rules:
- Answer personal HRIS questions using ONLY the employee_context JSON provided below.
- For app help, explain steps using these routes: /my-profile (profile, leave balance, documents, attendance), /leave-requests (submit leave), /it-requests, /employee-requests, /it-assets (IT inventory), /time-attendance, /employee-messages (peer chat).
- If policy information is not in employee_context, say you do not have that policy on file and suggest contacting HR.
- Never reveal other employees' information.
- Be concise, friendly, and professional.

employee_context:
PROMPT;

        $systemPrompt .= json_encode($context, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...$history,
        ];

        $settings = $this->settingsManager->resolved();

        $response = Http::withToken((string) ($settings['openai']['api_key'] ?? ''))
            ->acceptJson()
            ->timeout(60)
            ->post(rtrim((string) ($settings['openai']['base_url'] ?? ''), '/').'/chat/completions', [
                'model' => $settings['openai']['model'] ?? 'gpt-4o-mini',
                'messages' => $messages,
                'temperature' => 0.3,
            ]);

        if (! $response->successful()) {
            $providerError = data_get($response->json(), 'error.message');

            Log::warning('Employee assistant OpenAI request failed.', [
                'status' => $response->status(),
                'error' => is_string($providerError) ? $providerError : null,
            ]);

            throw new RuntimeException($this->openAiErrorMessage(
                $response->status(),
                is_string($providerError) ? $providerError : null,
            ));
        }

        $content = data_get($response->json(), 'choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('The assistant returned an empty response. Please try again.');
        }

        return trim($content);
    }

    private function openAiErrorMessage(int $status, ?string $providerError): string
    {
        $normalizedError = strtolower(trim((string) $providerError));

        if ($status === 401) {
            return 'The assistant API key is invalid. Please contact HR or IT support.';
        }

        if ($status === 429) {
            if (str_contains($normalizedError, 'quota') || str_contains($normalizedError, 'billing')) {
                return 'The assistant is temporarily unavailable because the OpenAI account has no remaining quota. Please contact HR or IT support.';
            }

            return 'The assistant is receiving too many requests right now. Please wait a moment and try again.';
        }

        if ($status === 403) {
            return 'The assistant is not authorized to use the configured AI model. Please contact HR or IT support.';
        }

        if ($providerError !== null && $providerError !== '') {
            Log::info('Employee assistant OpenAI provider error surfaced to client.', [
                'status' => $status,
            ]);
        }

        return 'The assistant could not generate a response right now. Please try again later.';
    }

    /**
     * @return array{id: int, title: string|null, updated_at: string}
     */
    public function conversationPayload(EmployeeAssistantConversation $conversation): array
    {
        return [
            'id' => (int) $conversation->id,
            'title' => $conversation->title,
            'updated_at' => $conversation->updated_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    /**
     * @return array{id: int, role: string, content: string, created_at: string}
     */
    public function messagePayload(EmployeeAssistantMessage $message): array
    {
        return [
            'id' => (int) $message->id,
            'role' => $message->role,
            'content' => $message->content,
            'created_at' => $message->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }
}
