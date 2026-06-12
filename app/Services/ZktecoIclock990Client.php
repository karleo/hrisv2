<?php

namespace App\Services;

use App\Models\BiometricSetting;
use Carbon\CarbonImmutable;
use RuntimeException;

class ZktecoIclock990Client
{
    /**
     * Poll lines from device and parse attendance payload rows.
     *
     * Device response is expected in CSV lines:
     * log_id,employee_identifier,punched_at,event
     *
     * @return list<array{log_id: string, employee_identifier: string, punched_at: CarbonImmutable, event: string}>
     */
    public function fetchPunches(BiometricSetting $settings): array
    {
        if (! $settings->is_enabled) {
            return [];
        }

        if (! is_string($settings->device_ip) || trim($settings->device_ip) === '') {
            throw new RuntimeException('Biometric device IP is not configured.');
        }

        $address = sprintf('tcp://%s:%d', trim($settings->device_ip), $settings->device_port);
        $socket = @stream_socket_client(
            $address,
            $errno,
            $error,
            $settings->timeout_seconds
        );

        if (! is_resource($socket)) {
            throw new RuntimeException(sprintf('Unable to connect to iClock990 (%s).', (string) $error));
        }

        stream_set_timeout($socket, $settings->timeout_seconds);

        $cursor = $settings->last_log_cursor;
        $command = 'GET ATTLOG';
        if (is_string($cursor) && trim($cursor) !== '') {
            $command .= ' '.trim($cursor);
        }
        if (is_string($settings->comm_key) && trim($settings->comm_key) !== '') {
            $command .= ' KEY='.trim($settings->comm_key);
        }
        $command .= "\n";

        fwrite($socket, $command);
        $payload = stream_get_contents($socket);
        fclose($socket);

        if (! is_string($payload) || trim($payload) === '') {
            return [];
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($payload)) ?: [];
        $rows = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parts = str_getcsv($line);
            if (count($parts) < 3) {
                continue;
            }

            $logId = trim((string) ($parts[0] ?? ''));
            $employeeIdentifier = trim((string) ($parts[1] ?? ''));
            $punchAtRaw = trim((string) ($parts[2] ?? ''));
            $event = trim((string) ($parts[3] ?? 'punch'));

            if ($logId === '' || $employeeIdentifier === '' || $punchAtRaw === '') {
                continue;
            }

            $rows[] = [
                'log_id' => $logId,
                'employee_identifier' => $employeeIdentifier,
                'punched_at' => CarbonImmutable::parse($punchAtRaw, $settings->timezone),
                'event' => $event === '' ? 'punch' : $event,
            ];
        }

        usort(
            $rows,
            fn (array $a, array $b): int => $a['punched_at']->getTimestamp() <=> $b['punched_at']->getTimestamp()
        );

        return $rows;
    }
}
