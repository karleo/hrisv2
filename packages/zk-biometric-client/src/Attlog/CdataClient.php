<?php

namespace PrimeLogistics\ZkBiometricClient\Attlog;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;
use RuntimeException;

final class CdataClient
{
    public function __construct(
        private readonly AttlogFormatter $formatter = new AttlogFormatter,
        private readonly ?Client $http = null,
        private readonly int $timeoutSeconds = 60,
    ) {}

    /**
     * @param  list<PunchRecord>  $punches
     * @return array{posted: int, failed: int, errors: list<string>}
     */
    public function postPunches(string $cdataBaseOrUrl, string $serialNumber, array $punches, int $chunkSize = 200): array
    {
        if ($punches === []) {
            return ['posted' => 0, 'failed' => 0, 'errors' => []];
        }

        $endpoint = $this->formatter->cdataEndpoint($cdataBaseOrUrl, $serialNumber);
        $chunkSize = max(1, $chunkSize);
        $client = $this->http ?? new Client(['timeout' => $this->timeoutSeconds]);
        $posted = 0;
        $failed = 0;
        $errors = [];

        foreach (array_chunk($punches, $chunkSize) as $chunk) {
            $body = $this->formatter->body($chunk);

            try {
                $response = $client->post($endpoint, [
                    'body' => $body,
                    'headers' => [
                        'Content-Type' => 'text/plain',
                    ],
                    'http_errors' => false,
                ]);

                $status = $response->getStatusCode();

                if ($status >= 200 && $status < 300) {
                    $posted += count($chunk);
                } else {
                    $failed += count($chunk);
                    $errors[] = 'HTTP '.$status.': '.substr((string) $response->getBody(), 0, 200);
                }
            } catch (GuzzleException $exception) {
                $failed += count($chunk);
                $errors[] = $exception->getMessage();
            }
        }

        return ['posted' => $posted, 'failed' => $failed, 'errors' => $errors];
    }

    /**
     * @param  list<PunchRecord>  $punches
     *
     * @throws RuntimeException when any chunk fails
     */
    public function postPunchesOrFail(string $cdataBaseOrUrl, string $serialNumber, array $punches, int $chunkSize = 200): int
    {
        $result = $this->postPunches($cdataBaseOrUrl, $serialNumber, $punches, $chunkSize);

        if ($result['failed'] > 0) {
            throw new RuntimeException(
                'ATTLOG upload failed ('.$result['failed'].' punch(es)): '.implode('; ', $result['errors']),
            );
        }

        return $result['posted'];
    }
}
