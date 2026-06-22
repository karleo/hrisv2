<?php

return [

    'enabled' => env('AI_ASSISTANT_ENABLED', true),

    'provider' => env('AI_ASSISTANT_PROVIDER', 'openai'),

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    ],

    'max_history' => (int) env('AI_ASSISTANT_MAX_HISTORY', 20),

    'rate_limit' => (int) env('AI_ASSISTANT_RATE_LIMIT', 20),

];
