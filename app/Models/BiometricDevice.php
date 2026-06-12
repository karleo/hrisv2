<?php

namespace App\Models;

use App\Enums\BiometricConnectionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $model
 * @property string $serial_number
 * @property BiometricConnectionType $connection_type
 * @property string|null $host
 * @property int $port
 * @property string|null $comm_key
 * @property string $timezone
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $last_sync_at
 * @property string|null $last_sync_status
 * @property string|null $last_error
 * @property array<string, mixed>|null $metadata
 */
class BiometricDevice extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'model',
        'serial_number',
        'connection_type',
        'host',
        'port',
        'comm_key',
        'timezone',
        'is_active',
        'last_sync_at',
        'last_sync_status',
        'last_error',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'connection_type' => BiometricConnectionType::class,
            'port' => 'integer',
            'comm_key' => 'encrypted',
            'is_active' => 'boolean',
            'last_sync_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function punches(): HasMany
    {
        return $this->hasMany(BiometricPunch::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(BiometricSyncLog::class);
    }

    public function commKeyValue(): int
    {
        $key = $this->comm_key;

        return $key !== null && $key !== '' ? (int) $key : 0;
    }

    /**
     * Passwords to try when opening a ZKTeco session (configured key, then 0).
     *
     * @return list<int>
     */
    public function commKeyCandidates(): array
    {
        $primary = $this->commKeyValue();
        $candidates = [$primary, 0, 1];

        $extra = config('biometric.zkteco_comm_key_fallbacks', [12345, 54321]);

        if (is_array($extra)) {
            foreach ($extra as $key) {
                if (is_numeric($key)) {
                    $candidates[] = (int) $key;
                }
            }
        }

        return array_values(array_unique($candidates));
    }

    /**
     * Protocols to try, in order (TCP first — typical for iClock990 on LAN).
     *
     * @return list<string>
     */
    public function zkProtocolsToTry(): array
    {
        $preferred = $this->zkProtocol();
        $alternate = $preferred === 'udp' ? 'tcp' : 'udp';

        return array_values(array_unique(['tcp', $preferred, $alternate]));
    }

    /**
     * ZKTeco wire protocol saved on the device record.
     */
    public function zkProtocol(): string
    {
        $protocol = $this->metadata['protocol'] ?? 'tcp';

        return in_array($protocol, ['tcp', 'udp'], true) ? $protocol : 'tcp';
    }

    public function deviceWebPort(): int
    {
        if ($this->connection_type === BiometricConnectionType::DeviceWebReport) {
            $port = (int) $this->port;

            if ($port <= 0 || $port === 4370) {
                return 80;
            }

            return $port;
        }

        $port = (int) $this->port;

        return $port > 0 ? $port : 4370;
    }

    public function deviceWebBaseUrl(): string
    {
        $host = trim((string) $this->host);
        $port = $this->deviceWebPort();

        if ($host === '') {
            return '';
        }

        $scheme = 'http';
        $portSuffix = $port === 80 ? '' : ':'.$port;

        return $scheme.'://'.$host.$portSuffix;
    }

    public function deviceWebUsername(): string
    {
        $username = $this->metadata['web_username'] ?? null;

        if (is_string($username) && trim($username) !== '') {
            return trim($username);
        }

        return trim((string) config('biometric.device_web.default_username', 'administrator'));
    }

    public function deviceWebPassword(): string
    {
        $password = $this->metadata['web_password'] ?? null;

        if (is_string($password) && $password !== '') {
            return $password;
        }

        return (string) config('biometric.device_web.default_password', '');
    }

    public function hasDeviceWebPassword(): bool
    {
        return $this->deviceWebPassword() !== '';
    }
}
