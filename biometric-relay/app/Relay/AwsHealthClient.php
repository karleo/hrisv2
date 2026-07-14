<?php

namespace BiometricRelay\Relay;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

final class AwsHealthClient
{
    public function __construct(
        private readonly string $healthUrl,
        private readonly string $heartbeatUrl,
        private readonly string $token,
        private readonly ?Client $http = null,
    ) {}

    /**
     * @return array{ok: bool, status: string, body: array<string, mixed>}
     */
    public function check(): array
    {
        if ($this->healthUrl === '') {
            return ['ok' => false, 'status' => 'missing_health_url', 'body' => []];
        }

        $client = $this->http ?? new Client(['timeout' => 15]);

        try {
            $response = $client->get($this->healthUrl, [
                'headers' => $this->authHeaders(),
                'http_errors' => false,
            ]);

            $status = $response->getStatusCode();
            $decoded = json_decode((string) $response->getBody(), true);

            return [
                'ok' => $status >= 200 && $status < 300,
                'status' => (string) $status,
                'body' => is_array($decoded) ? $decoded : [],
            ];
        } catch (GuzzleException $exception) {
            return [
                'ok' => false,
                'status' => 'unreachable',
                'body' => ['error' => $exception->getMessage()],
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function heartbeat(array $payload): bool
    {
        if ($this->heartbeatUrl === '') {
            return false;
        }

        $client = $this->http ?? new Client(['timeout' => 15]);

        try {
            $response = $client->post($this->heartbeatUrl, [
                'headers' => array_merge($this->authHeaders(), [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ]),
                'json' => $payload,
                'http_errors' => false,
            ]);

            return $response->getStatusCode() >= 200 && $response->getStatusCode() < 300;
        } catch (GuzzleException) {
            return false;
        }
    }

    /**
     * @return array<string, string>
     */
    private function authHeaders(): array
    {
        if ($this->token === '') {
            return ['Accept' => 'application/json'];
        }

        return [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer '.$this->token,
            'X-Biometric-Relay-Token' => $this->token,
        ];
    }
}
