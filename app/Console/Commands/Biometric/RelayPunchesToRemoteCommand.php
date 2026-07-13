<?php

namespace App\Console\Commands\Biometric;

use App\Enums\BiometricPunchDirection;
use App\Models\BiometricDevice;
use App\Models\BiometricPunch;
use App\Support\BiometricPushUrl;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class RelayPunchesToRemoteCommand extends Command
{
    protected $signature = 'biometric:relay-punches
                            {device : Biometric device ID}
                            {--url= : Remote /iclock/cdata URL (defaults to BIOMETRIC_PUSH_BASE_URL)}
                            {--from= : From date Y-m-d (device timezone)}
                            {--to= : To date Y-m-d (device timezone)}
                            {--chunk=200 : ATTLOG lines per HTTP POST}';

    protected $description = 'POST punches already in this HRIS DB to a remote ADMS cdata URL (e.g. Laragon → staging)';

    public function handle(): int
    {
        $device = BiometricDevice::query()->find($this->argument('device'));

        if ($device === null) {
            $this->error('Device not found.');

            return self::FAILURE;
        }

        $url = (string) ($this->option('url') ?: BiometricPushUrl::cdataEndpoint());
        $url = rtrim($url, '/');

        if (! str_contains($url, '/iclock/cdata')) {
            $url .= '/iclock/cdata';
        }

        $timezone = $device->timezone;
        $fromOption = $this->option('from');
        $toOption = $this->option('to');

        $query = BiometricPunch::query()
            ->where('biometric_device_id', $device->id)
            ->orderBy('punched_at')
            ->orderBy('id');

        if (is_string($fromOption) && $fromOption !== '') {
            $fromBound = Carbon::parse($fromOption, $timezone)->startOfDay()->format('Y-m-d H:i:s');
            $query->where('punched_at', '>=', $fromBound);
        }

        if (is_string($toOption) && $toOption !== '') {
            $untilBound = Carbon::parse($toOption, $timezone)->endOfDay()->format('Y-m-d H:i:s');
            $query->where('punched_at', '<=', $untilBound);
        }

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->warn('No punches in this database for that device/range.');
            $this->line('On Laragon (same LAN as the device): set host IP, Switch to web report pull, Import first.');

            return self::FAILURE;
        }

        $chunkSize = max(1, (int) $this->option('chunk'));
        $endpoint = $url.'?SN='.$device->serial_number.'&table=ATTLOG';
        $posted = 0;
        $failed = 0;

        $this->info("Relaying {$total} punch(es) from device #{$device->id} ({$device->serial_number})");
        $this->line("  To: {$endpoint}");

        $query->chunkById($chunkSize, function ($punches) use ($endpoint, &$posted, &$failed): void {
            $lines = [];

            foreach ($punches as $punch) {
                /** @var BiometricPunch $punch */
                $lines[] = $this->attlogLine($punch);
            }

            $body = implode("\n", $lines);

            try {
                $response = Http::withBody($body, 'text/plain')
                    ->timeout(60)
                    ->post($endpoint);

                if ($response->successful()) {
                    $posted += count($lines);
                    $this->line('  Posted chunk of '.count($lines).' → HTTP '.$response->status());
                } else {
                    $failed += count($lines);
                    $this->error('  Chunk failed HTTP '.$response->status().': '.substr($response->body(), 0, 200));
                }
            } catch (\Throwable $exception) {
                $failed += count($lines);
                $this->error('  Chunk error: '.$exception->getMessage());
            }
        });

        $this->newLine();
        $this->info("Done. Posted≈{$posted}, failed≈{$failed}.");
        $this->line('On staging: open Raw punches, then Import attendance again to map/pair sessions.');

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function attlogLine(BiometricPunch $punch): string
    {
        $raw = $punch->getRawOriginal('punched_at');
        $timestamp = is_string($raw) && trim($raw) !== ''
            ? trim($raw)
            : ($punch->punched_at?->format('Y-m-d H:i:s') ?? now()->format('Y-m-d H:i:s'));

        $status = match ($punch->direction) {
            BiometricPunchDirection::In => 0,
            BiometricPunchDirection::Out => 1,
            default => 0,
        };

        $verify = $punch->verify_type ?? 1;
        $work = $punch->work_code ?? '0';

        return "{$punch->device_user_id}\t{$timestamp}\t{$status}\t{$verify}\t0\t{$work}";
    }
}
