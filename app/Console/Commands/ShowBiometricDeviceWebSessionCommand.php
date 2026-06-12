<?php

namespace App\Console\Commands;

use App\Models\BiometricDevice;
use Illuminate\Console\Command;

class ShowBiometricDeviceWebSessionCommand extends Command
{
    protected $signature = 'biometric:show-device-web-session {device : Device ID}';

    protected $description = 'Read SessionID from the iClock web UI (for pasting into device metadata as web_session_id)';

    public function handle(): int
    {
        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $this->error('Device not found.');

            return self::FAILURE;
        }

        $host = trim((string) $device->host);

        if ($host === '') {
            $this->error('Device host is not set.');

            return self::FAILURE;
        }

        $port = $device->deviceWebPort();
        $socket = @fsockopen($host, $port, $errno, $errstr, 15);

        if (! is_resource($socket)) {
            $this->error("Cannot connect: {$errstr}");

            return self::FAILURE;
        }

        fwrite($socket, "GET / HTTP/1.0\r\nHost: {$host}\r\nConnection: close\r\n\r\n");
        $raw = stream_get_contents($socket);
        fclose($socket);

        if (! is_string($raw) || preg_match('/SessionID=([^;\s]+)/i', $raw, $matches) !== 1) {
            $this->error('No SessionID in response. Close browser tabs to http://'.$host.', wait 30s, reboot device, retry.');

            return self::FAILURE;
        }

        $this->info('SessionID='.$matches[1]);
        $this->line('Save on the device in HRIS metadata as web_session_id if automatic import keeps failing.');

        return self::SUCCESS;
    }
}
