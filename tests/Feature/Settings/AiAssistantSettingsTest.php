<?php

namespace Tests\Feature\Settings;

use App\Models\AiAssistantSetting;
use App\Models\Role;
use App\Models\User;
use App\Services\EmployeeAssistant\AiAssistantSettingsManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AiAssistantSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_ai_assistant_settings_page_requires_administrator(): void
    {
        $basicRoleId = Role::query()->where('slug', 'basic')->value('id');
        $user = User::factory()->create([
            'role_id' => $basicRoleId,
        ]);

        $this->actingAs($user)
            ->get(route('ai-assistant.edit'))
            ->assertForbidden();
    }

    public function test_ai_assistant_settings_update_encrypts_api_key_and_never_exposes_raw_key(): void
    {
        $admin = User::factory()->create();

        $response = $this->actingAs($admin)->put(route('ai-assistant.update'), [
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'api_key' => 'sk-test-secret-key',
            'base_url' => 'https://api.openai.com/v1',
            'max_history' => 20,
            'rate_limit' => 20,
        ]);

        $response->assertRedirect(route('ai-assistant.edit'));

        $row = AiAssistantSetting::query()->firstOrFail();
        $this->assertNotSame('sk-test-secret-key', $row->getRawOriginal('api_key'));
        $this->assertSame('sk-test-secret-key', $row->api_key);

        $page = $this->actingAs($admin)->get(route('ai-assistant.edit'));
        $page->assertOk();
        $page->assertInertia(fn (Assert $inertia) => $inertia
            ->where('settings.has_api_key', true)
            ->where('settings.source', 'database')
            ->missing('settings.api_key')
        );
    }

    public function test_ai_assistant_settings_manager_falls_back_to_env_when_db_configuration_is_invalid(): void
    {
        config([
            'ai-assistant.enabled' => true,
            'ai-assistant.openai.api_key' => 'env-key',
            'ai-assistant.openai.model' => 'gpt-4o-mini',
            'ai-assistant.openai.base_url' => 'https://api.openai.com/v1',
        ]);

        AiAssistantSetting::singletonOrCreate([
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
        ])->update([
            'model' => '',
            'api_key' => null,
        ]);

        /** @var AiAssistantSettingsManager $manager */
        $manager = app(AiAssistantSettingsManager::class);
        $manager->forgetCache();
        $resolved = $manager->resolved();

        $this->assertSame('env', $resolved['source']);
        $this->assertSame('env-key', $resolved['openai']['api_key']);
    }

    public function test_test_connection_endpoint_uses_unsaved_payload_and_updates_last_test_status(): void
    {
        $admin = User::factory()->create();

        AiAssistantSetting::query()->delete();
        app(AiAssistantSettingsManager::class)->forgetCache();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'OK']],
                ],
            ], 200),
        ]);

        AiAssistantSetting::singletonOrCreate([
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'api_key' => 'stored-key',
            'base_url' => 'https://api.openai.com/v1',
            'max_history' => 20,
            'rate_limit' => 20,
        ]);

        $this->actingAs($admin)
            ->post(route('ai-assistant.test'), [
                'enabled' => false,
                'provider' => 'openai',
                'model' => 'gpt-4o-mini',
                'api_key' => 'draft-key',
                'base_url' => 'https://api.openai.com/v1',
                'max_history' => 20,
                'rate_limit' => 20,
                'test_message' => 'Reply with exactly: OK',
            ])
            ->assertRedirect(route('ai-assistant.edit'))
            ->assertSessionHasErrors([
                'test_message' => 'Connection test failed: Enable the assistant before running a connection test.',
            ]);

        $setting = AiAssistantSetting::singleton();
        $this->assertNotNull($setting);
        $this->assertSame('stored-key', $setting->api_key);
    }

    public function test_test_connection_endpoint_succeeds_with_valid_payload(): void
    {
        $admin = User::factory()->create();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'OK']],
                ],
            ], 200),
        ]);

        $this->actingAs($admin)
            ->post(route('ai-assistant.test'), [
                'enabled' => true,
                'provider' => 'openai',
                'model' => 'gpt-4o-mini',
                'api_key' => 'draft-key',
                'base_url' => 'https://api.openai.com/v1',
                'max_history' => 20,
                'rate_limit' => 20,
                'test_message' => 'Reply with exactly: OK',
            ])
            ->assertRedirect(route('ai-assistant.edit'))
            ->assertSessionHas('success');
    }

    public function test_test_connection_endpoint_is_rate_limited(): void
    {
        $admin = User::factory()->create();

        Http::fake([
            'api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'OK']],
                ],
            ], 200),
        ]);

        $payload = [
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'api_key' => 'rate-key',
            'base_url' => 'https://api.openai.com/v1',
            'max_history' => 20,
            'rate_limit' => 20,
            'test_message' => 'Reply with exactly: OK',
        ];

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($admin)->post(route('ai-assistant.test'), $payload)->assertRedirect();
        }

        $this->actingAs($admin)
            ->post(route('ai-assistant.test'), $payload)
            ->assertTooManyRequests();
    }
}
