<?php

namespace Database\Factories;

use App\Models\AiAssistantSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiAssistantSetting>
 */
class AiAssistantSettingFactory extends Factory
{
    protected $model = AiAssistantSetting::class;

    public function definition(): array
    {
        return [
            'enabled' => true,
            'provider' => 'openai',
            'model' => 'gpt-4o-mini',
            'api_key' => 'sk-test-key',
            'base_url' => 'https://api.openai.com/v1',
            'max_history' => 20,
            'rate_limit' => 20,
        ];
    }
}
