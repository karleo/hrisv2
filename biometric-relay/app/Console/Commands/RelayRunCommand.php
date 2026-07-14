<?php

namespace BiometricRelay\Console\Commands;

use BiometricRelay\Relay\AwsHealthClient;
use BiometricRelay\Relay\RelayRunner;
use BiometricRelay\Relay\RetryQueue;
use BiometricRelay\Relay\RunLogger;
use BiometricRelay\Relay\WatermarkStore;
use Illuminate\Console\Command;
use PrimeLogistics\ZkBiometricClient\Attlog\CdataClient;
use PrimeLogistics\ZkBiometricClient\Device\DeviceConfig;
use PrimeLogistics\ZkBiometricClient\WebReport\WebReportClient;

class RelayRunCommand extends Command
{
    protected $signature = 'relay:run';

    protected $description = 'Pull punches from the LAN biometric device and POST ATTLOG to AWS HRIS';

    public function handle(): int
    {
        $host = (string) config('relay.device.host');
        $serial = (string) config('relay.device.serial_number');

        if ($host === '' || $serial === '') {
            $this->error('Set RELAY_DEVICE_HOST and RELAY_DEVICE_SERIAL in .env');

            return self::FAILURE;
        }

        $device = new DeviceConfig(
            host: $host,
            serialNumber: $serial,
            timezone: (string) config('relay.device.timezone'),
            port: (int) config('relay.device.port'),
            username: (string) config('relay.device.username'),
            password: (string) config('relay.device.password'),
            webSessionId: config('relay.device.web_session_id') ?: null,
            timeoutSeconds: (int) config('relay.device.timeout'),
        );

        $runner = new RelayRunner(
            webReport: new WebReportClient,
            cdata: new CdataClient,
            watermarkStore: new WatermarkStore((string) config('relay.state_path')),
            retryQueue: new RetryQueue(
                (string) config('relay.pending_path'),
                $device->timezone,
            ),
            healthClient: new AwsHealthClient(
                healthUrl: (string) config('relay.health_url'),
                heartbeatUrl: (string) config('relay.heartbeat_url'),
                token: (string) config('relay.token'),
            ),
            logger: new RunLogger,
            device: $device,
            cdataUrl: (string) config('relay.cdata_url'),
            chunkSize: (int) config('relay.chunk_size'),
        );

        $summary = $runner->run();

        $this->info(sprintf(
            'status=%s pulled=%d relayed=%d failures=%d retries=%d duration_ms=%d upload_ms=%d',
            $summary['status'],
            $summary['punches_pulled'],
            $summary['punches_relayed'],
            $summary['failures'],
            $summary['retry_count'],
            $summary['duration_ms'],
            $summary['upload_duration_ms'],
        ));

        foreach ($summary['errors'] as $error) {
            $this->warn($error);
        }

        return in_array($summary['status'], ['ok', 'idle', 'queued_for_retry'], true)
            ? self::SUCCESS
            : self::FAILURE;
    }
}
