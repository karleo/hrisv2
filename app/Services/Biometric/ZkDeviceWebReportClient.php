<?php

namespace App\Services\Biometric;

use App\Models\BiometricDevice;
use Carbon\CarbonInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Cookie\SetCookie;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\File;
use Psr\Http\Message\ResponseInterface;
use RuntimeException;

final class ZkDeviceWebReportClient
{
    private ?string $lastSessionIdUsed = null;

    private bool $forceNoSession = false;

    public const string REPORT_TYPE_LOGIN = 'login_page';

    public const string REPORT_TYPE_SESSION_EXPIRED = 'session_expired';

    public const string REPORT_TYPE_EMPTY = 'empty_report';

    public const string REPORT_TYPE_ATTENDANCE = 'attendance_table';

    public const string REPORT_TYPE_UNKNOWN = 'unknown';

    public function __construct(
        private readonly ZkDeviceWebReportHtmlParser $parser,
        private readonly BiometricPipelineTracer $tracer,
    ) {}

    public function lastSessionIdUsed(): ?string
    {
        return $this->lastSessionIdUsed;
    }

    public function useForceNoSession(bool $forceNoSession = true): void
    {
        $this->forceNoSession = $forceNoSession;
    }

    public function testLogin(BiometricDevice $device): bool
    {
        $client = $this->authenticateClient(rtrim($device->deviceWebBaseUrl(), '/'), $device);
        $baseUrl = rtrim($device->deviceWebBaseUrl(), '/');
        $indexHtml = $this->fetchReportIndexHtml($client, $baseUrl);

        if (! $this->looksLikeReportIndex($indexHtml)) {
            throw new RuntimeException(
                'Logged in but could not open the attendance report at '.$baseUrl.'.',
            );
        }

        return true;
    }

    /**
     * @return list<BiometricPunchData>
     */
    public function fetchPunches(BiometricDevice $device, CarbonInterface $from, CarbonInterface $until): array
    {
        $started = microtime(true);
        $this->tracer->stage('client_fetch_punches_start', [
            'device_id' => $device->id,
            'from' => $from->toIso8601String(),
            'until' => $until->toIso8601String(),
        ]);

        $timezone = $device->timezone;
        $fromLocal = $from->copy()->timezone($timezone)->startOfDay();
        $untilLocal = $until->copy()->timezone($timezone)->endOfDay();

        $fetch = $this->fetchReportForDiagnostics($device, $fromLocal, $untilLocal);
        $parseResult = $this->parser->parseWithDiagnostics($fetch['html'], $timezone);

        $this->tracer->log('PARSER '.$parseResult->logLine());

        $filtered = array_values(array_filter(
            $parseResult->punches,
            fn (BiometricPunchData $punch): bool => $punch->punchedAt->between($from, $until),
        ));

        $this->tracer->stage('client_fetch_punches_done', [
            'parsed' => count($parseResult->punches),
            'in_range' => count($filtered),
            'filtered_out' => count($parseResult->punches) - count($filtered),
            'ms' => (int) round((microtime(true) - $started) * 1000),
        ]);

        if ($parseResult->punches !== [] && $filtered === []) {
            throw new RuntimeException(
                'Device report had '.count($parseResult->punches).' punch(es) but none matched the import date range. '
                .'Use the same From/To dates as on the device Report page.',
            );
        }

        return $filtered;
    }

    /**
     * @return array{
     *     html: string,
     *     user_count: int,
     *     report_type: string,
     *     http_status: int,
     *     html_length: int,
     *     data_row_count: int,
     *     post_body_preview: string,
     * }
     */
    public function fetchReportForDiagnostics(BiometricDevice $device, CarbonInterface $from, CarbonInterface $until): array
    {
        $baseUrl = rtrim($device->deviceWebBaseUrl(), '/');
        $client = $this->authenticateClient($baseUrl, $device);

        $this->bootstrapSession($client, $baseUrl);

        $userIds = $this->collectDeviceUserIds($client, $baseUrl);

        $this->tracer->stage('client_users_collected', ['user_count' => count($userIds)]);

        if ($userIds === []) {
            throw new RuntimeException(
                'Could not read device user IDs from '.$baseUrl.'. '
                .'Log in on the device web UI and confirm users appear under User or Report (ID Number column).',
            );
        }

        $fromDate = $from->format('Y-m-d');
        $untilDate = $until->format('Y-m-d');
        $postBody = $this->buildReportSearchBody($fromDate, $untilDate, $userIds);

        $this->validateReportPostBody($postBody);

        $this->tracer->log('REPORT_START', [
            'from' => $fromDate,
            'to' => $untilDate,
            'users' => count($userIds),
        ]);

        $started = microtime(true);

        try {
            $response = $client->post($baseUrl.'/csl/report?action=run', [
                'body' => $postBody,
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded',
                    'Referer' => $baseUrl.'/csl/report',
                ],
            ]);
        } catch (GuzzleException $exception) {
            throw new RuntimeException(
                'Could not run attendance report on device: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        $html = $this->normalizeResponseBody((string) $response->getBody());
        $status = $response->getStatusCode();

        $this->persistDebugReportHtml($html);
        $this->logReportResponse($response, $html, $postBody, (int) round((microtime(true) - $started) * 1000));

        $reportType = $this->classifyReportHtml($html);
        $dataRowCount = $this->countReportDataRows($html);

        $this->tracer->stage('client_report_classified', [
            'report_type' => $reportType,
            'data_rows' => $dataRowCount,
        ]);

        $this->assertReportHtmlIsUsable($html, $reportType, $fromDate, $untilDate, $baseUrl);

        return [
            'html' => $html,
            'user_count' => count($userIds),
            'report_type' => $reportType,
            'http_status' => $status,
            'html_length' => strlen($html),
            'data_row_count' => $dataRowCount,
            'post_body_preview' => substr($postBody, 0, 500),
        ];
    }

    private function fetchReportHtml(BiometricDevice $device, CarbonInterface $from, CarbonInterface $until): string
    {
        return $this->fetchReportForDiagnostics($device, $from, $until)['html'];
    }

    private function validateReportPostBody(string $postBody): void
    {
        if (str_contains($postBody, 'uid[]') || str_contains($postBody, 'uid%5B')) {
            throw new RuntimeException('Invalid report POST body: must use uid=1&uid=2, not uid[] arrays.');
        }

        if (! preg_match('/(?:^|&)uid=\d+(?:&|$)/', $postBody)) {
            throw new RuntimeException('Invalid report POST body: missing repeated uid= fields.');
        }
    }

    private function logReportResponse(ResponseInterface $response, string $html, string $postBody, int $ms): void
    {
        $preview = preg_replace('/\s+/', ' ', substr($html, 0, 500)) ?? '';

        $this->tracer->log('REPORT_RESPONSE status='.$response->getStatusCode().' length='.strlen($html), [
            'ms' => $ms,
            'preview' => $preview,
            'post_body_preview' => substr($postBody, 0, 200),
            'uid_field_count' => substr_count($postBody, 'uid='),
        ]);
    }

    private function persistDebugReportHtml(string $html): void
    {
        if (! config('biometric.debug_save_report_html', true)) {
            return;
        }

        $directory = storage_path('app/biometric');

        if (! is_dir($directory)) {
            File::ensureDirectoryExists($directory);
        }

        file_put_contents($directory.DIRECTORY_SEPARATOR.'debug_report.html', $html);
    }

    private function classifyReportHtml(string $html): string
    {
        if ($this->isLoginPage($html)) {
            return self::REPORT_TYPE_LOGIN;
        }

        if ($this->isRedirectStub($html)) {
            return self::REPORT_TYPE_SESSION_EXPIRED;
        }

        $lower = strtolower($html);

        if (! str_contains($lower, 'id number') && ! str_contains($lower, 'id no') && ! str_contains($lower, 'pin')) {
            return self::REPORT_TYPE_UNKNOWN;
        }

        if ($this->countReportDataRows($html) > 0) {
            return self::REPORT_TYPE_ATTENDANCE;
        }

        return self::REPORT_TYPE_EMPTY;
    }

    private function countReportDataRows(string $html): int
    {
        if (preg_match_all('/<tr[^>]*>.*?<td[^>]*>\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/is', $html, $matches) >= 1) {
            return count($matches[0]);
        }

        if (preg_match_all('/<tr[^>]*>.*?<td[^>]*>\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/is', $html, $matches) >= 1) {
            return count($matches[0]);
        }

        if (preg_match_all('/<tr[^>]*>.*?<td[^>]*>\d{1,2}:\d{2}(?::\d{2})?/is', $html, $matches) >= 1) {
            return count($matches[0]);
        }

        return 0;
    }

    private function assertReportHtmlIsUsable(
        string $html,
        string $reportType,
        string $fromDate,
        string $untilDate,
        string $baseUrl,
    ): void {
        match ($reportType) {
            self::REPORT_TYPE_LOGIN => throw new RuntimeException(
                'Device returned the login page instead of the attendance report. Re-save Web SessionID and test connectivity.',
            ),
            self::REPORT_TYPE_SESSION_EXPIRED => throw new RuntimeException(
                'Device report session expired (redirect response). Close browser tabs to '.$baseUrl.', update Web SessionID, then retry.',
            ),
            self::REPORT_TYPE_EMPTY => throw new RuntimeException(
                'Device report returned headers but no attendance rows for '.$fromDate.' to '.$untilDate.'. '
                .'On '.$baseUrl.' open Report, set the same dates, click Search, and confirm rows appear before importing.',
            ),
            self::REPORT_TYPE_UNKNOWN => throw new RuntimeException(
                'Device report response was not recognized as an attendance table. See storage/app/biometric/debug_report.html',
            ),
            self::REPORT_TYPE_ATTENDANCE => null,
            default => throw new RuntimeException('Unexpected device report type: '.$reportType),
        };
    }

    /**
     * Collect internal device user keys used by /csl/report?action=run (uid=1&uid=2…).
     * Tries Report employee list first, then User administration as fallback.
     *
     * @return list<string>
     */
    private function collectDeviceUserIds(Client $client, string $baseUrl): array
    {
        $fromReport = $this->collectPaginatedUserIds($client, $baseUrl, '/csl/report');

        if ($fromReport !== []) {
            return $fromReport;
        }

        return $this->collectPaginatedUserIds($client, $baseUrl, '/csl/user');
    }

    /**
     * @return list<string>
     */
    private function collectPaginatedUserIds(Client $client, string $baseUrl, string $basePath): array
    {
        $userIds = [];

        for ($first = 0; $first <= 500; $first += 20) {
            $path = $first === 0
                ? $basePath
                : $basePath.'?first='.$first.'&last='.($first + 20);

            $html = $this->fetchReportIndexHtml($client, $baseUrl, $path);

            if ($first === 0 && $this->isRedirectStub($html)) {
                $this->bootstrapSession($client, $baseUrl);
                $html = $this->fetchReportIndexHtml($client, $baseUrl, $path);
            }

            $pageIds = $this->parseDeviceUserIds($html);

            if ($pageIds === []) {
                break;
            }

            foreach ($pageIds as $id) {
                $userIds[$id] = $id;
            }
        }

        return array_values($userIds);
    }

    /**
     * @return list<string>
     */
    private function parseDeviceUserIds(string $html): array
    {
        $patterns = [
            '/name=uid\s+value=(\d+)/i',
            '/<input[^>]*\bname=["\']?uid["\']?[^>]*\bvalue=["\']?(\d+)/i',
        ];

        $userIds = [];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $html, $matches) < 1) {
                continue;
            }

            foreach ($matches[1] as $id) {
                $userIds[$id] = $id;
            }
        }

        return array_values($userIds);
    }

    /**
     * ZKTeco expects repeated uid= fields (uid=1&uid=2), not uid[0]=1.
     *
     * @param  list<string>  $userIds
     */
    private function buildReportSearchBody(string $fromDate, string $untilDate, array $userIds): string
    {
        $parts = [
            'sdate='.$fromDate,
            'edate='.$untilDate,
            'period=0',
        ];

        foreach ($userIds as $userId) {
            $parts[] = 'uid='.rawurlencode($userId);
        }

        return implode('&', $parts);
    }

    private function fetchReportIndexHtml(Client $client, string $baseUrl, string $path = '/csl/report'): string
    {
        try {
            $body = (string) $client->get($baseUrl.$path)->getBody();
        } catch (GuzzleException $exception) {
            throw new RuntimeException(
                'Could not open device report page: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        return $this->normalizeResponseBody($body);
    }

    private function authenticateClient(string $baseUrl, BiometricDevice $device): Client
    {
        if (! $this->forceNoSession) {
            $savedSessionId = $this->savedWebSessionId($device);

            if ($savedSessionId !== null) {
                $client = $this->attemptLogin($baseUrl, $device, $savedSessionId);

                if ($client !== null) {
                    return $client;
                }
            }

            $optionalSessionId = $this->tryAcquireOptionalSessionId($baseUrl, $device);

            if ($optionalSessionId !== null) {
                $client = $this->attemptLogin($baseUrl, $device, $optionalSessionId);

                if ($client !== null) {
                    return $client;
                }
            } else {
                logger()->warning('No SessionID from initial GET; continuing login.', [
                    'device_id' => $device->id,
                    'host' => $device->host,
                ]);
                $this->tracer->log('No SessionID from initial GET; continuing login.', [
                    'device_id' => $device->id,
                ]);
            }
        } else {
            $this->tracer->log('force_no_session enabled; skipping SessionID pre-fetch.', [
                'device_id' => $device->id,
            ]);
        }

        $client = $this->tryLoginWithoutSession($baseUrl, $device);

        if ($client !== null) {
            return $client;
        }

        throw new RuntimeException(
            'Could not log in or open the attendance report at '.$baseUrl.'. '
            .'/csl/check was rejected or /csl/report is inaccessible. '
            .$this->credentialHint($device),
        );
    }

    private function tryLoginWithoutSession(string $baseUrl, BiometricDevice $device): ?Client
    {
        $this->tracer->stage('client_login_without_session', ['device_id' => $device->id]);

        return $this->attemptLogin($baseUrl, $device, null);
    }

    private function attemptLogin(string $baseUrl, BiometricDevice $device, ?string $initialSessionId): ?Client
    {
        $credentialErrors = [];
        $reportErrors = [];
        $host = parse_url($baseUrl, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            throw new RuntimeException('Device host is invalid for web report pull.');
        }

        foreach ($this->credentialAttempts($device) as $label => [$username, $password]) {
            $jar = new CookieJar;
            $client = $this->createClient($jar);

            try {
                if ($initialSessionId !== null) {
                    $this->attachSessionCookie($jar, $host, $initialSessionId);
                }

                $client->get($baseUrl.'/', ['http_errors' => false]);

                $checkResponse = $client->post($baseUrl.'/csl/check', [
                    'form_params' => [
                        'username' => $username,
                        'userpwd' => $password,
                    ],
                    'http_errors' => false,
                ]);

                $checkBody = $this->normalizeResponseBody((string) $checkResponse->getBody());
            } catch (GuzzleException $exception) {
                throw new RuntimeException('Cannot reach device: '.$exception->getMessage(), previous: $exception);
            }

            if ($this->isLoginFailureResponse($checkBody)) {
                $credentialErrors[] = $label.' (wrong Login ID or Password)';

                continue;
            }

            $sessionId = $this->resolveSessionId($jar, $checkResponse, $initialSessionId, $host);

            if ($sessionId !== null) {
                $this->lastSessionIdUsed = $sessionId;
                $this->persistWebSessionId($device, $sessionId);
            }

            $authenticated = $this->isAuthenticatedCheckResponse($checkBody);

            if (! $authenticated && $sessionId === null) {
                $this->tracer->log('POST /csl/check without SessionID; attempting /csl/report anyway.', [
                    'credential' => $label,
                    'status' => $checkResponse->getStatusCode(),
                ]);
            }

            if (! $authenticated && $sessionId === null && $this->isLoginPage($checkBody)) {
                $credentialErrors[] = $label.' (login page returned)';

                continue;
            }

            $indexHtml = $this->fetchReportIndexHtml($client, $baseUrl);

            if ($this->looksLikeReportIndex($indexHtml)) {
                $this->tracer->stage('client_login_ok', [
                    'credential' => $label,
                    'session_id' => $sessionId ?? 'none',
                ]);

                return $client;
            }

            if ($this->isLoginPage($indexHtml)) {
                $reportErrors[] = $label.' (/csl/report returned login page)';

                continue;
            }

            if ($this->isRedirectStub($indexHtml)) {
                $reportErrors[] = $label.' (/csl/report session expired)';

                continue;
            }

            $reportErrors[] = $label.' (/csl/report not accessible)';
        }

        if ($credentialErrors !== []) {
            throw new RuntimeException(
                'Could not log in to the device web UI at '.$baseUrl.'. Device rejected credentials: '
                .implode('; ', $credentialErrors).'. '.$this->credentialHint($device),
            );
        }

        if ($reportErrors !== []) {
            $this->tracer->log('Report access failed after login attempts.', ['errors' => $reportErrors]);
        }

        return null;
    }

    private function resolveSessionId(CookieJar $jar, ResponseInterface $checkResponse, ?string $fallback, string $host): ?string
    {
        $fromJar = $this->extractSessionIdFromJar($jar);

        if ($fromJar !== null) {
            return $fromJar;
        }

        $fromResponse = $this->extractSessionIdFromResponse($checkResponse);

        if ($fromResponse !== null) {
            $this->attachSessionCookie($jar, $host, $fromResponse);

            return $fromResponse;
        }

        return $fallback;
    }

    private function extractSessionIdFromJar(CookieJar $jar): ?string
    {
        foreach ($jar->toArray() as $cookie) {
            if (($cookie['Name'] ?? '') === 'SessionID' && is_string($cookie['Value'] ?? null) && $cookie['Value'] !== '') {
                return $cookie['Value'];
            }
        }

        return null;
    }

    private function extractSessionIdFromResponse(ResponseInterface $response): ?string
    {
        foreach ($response->getHeader('Set-Cookie') as $cookieHeader) {
            if (preg_match('/SessionID=([^;\s]+)/i', $cookieHeader, $matches) === 1) {
                return $matches[1];
            }
        }

        return null;
    }

    private function savedWebSessionId(BiometricDevice $device): ?string
    {
        $override = $device->metadata['web_session_id'] ?? null;

        if (! is_string($override)) {
            return null;
        }

        $trimmed = trim($override);

        return preg_match('/^\d+$/', $trimmed) === 1 ? $trimmed : null;
    }

    private function tryAcquireOptionalSessionId(string $baseUrl, BiometricDevice $device): ?string
    {
        $host = parse_url($baseUrl, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return null;
        }

        $port = $device->deviceWebPort();
        $timeout = (int) config('biometric.device_web.timeout', 30);

        $sessionId = $this->extractSessionIdFromRaw($this->rawGet($host, $port, '/', $timeout));

        if ($sessionId !== null) {
            return $sessionId;
        }

        return $this->extractSessionIdFromGuzzle($baseUrl);
    }

    private function extractSessionIdFromGuzzle(string $baseUrl): ?string
    {
        $jar = new CookieJar;
        $client = $this->createClient($jar);

        try {
            foreach (['/', '/csl/login'] as $path) {
                $client->get(rtrim($baseUrl, '/').$path, ['http_errors' => false]);

                foreach ($jar->toArray() as $cookie) {
                    if (($cookie['Name'] ?? '') === 'SessionID' && is_string($cookie['Value'] ?? null) && $cookie['Value'] !== '') {
                        return $cookie['Value'];
                    }
                }
            }
        } catch (GuzzleException) {
            return null;
        }

        return null;
    }

    private function persistWebSessionId(BiometricDevice $device, string $sessionId): void
    {
        if ($sessionId === '') {
            return;
        }

        $metadata = $device->metadata ?? [];

        if (($metadata['web_session_id'] ?? null) === $sessionId) {
            return;
        }

        $metadata['web_session_id'] = $sessionId;
        $device->update(['metadata' => $metadata]);
        $device->refresh();
    }

    private function rawGet(string $host, int $port, string $path, int $timeout, ?string $cookie = null): string
    {
        $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

        if (! is_resource($socket)) {
            throw new RuntimeException("Cannot connect to {$host}:{$port}: {$errstr}");
        }

        stream_set_timeout($socket, $timeout);

        $headers = "Host: {$host}\r\nConnection: close\r\n";

        if ($cookie !== null) {
            $headers .= 'Cookie: '.$cookie."\r\n";
        }

        fwrite($socket, 'GET '.$path." HTTP/1.0\r\n{$headers}\r\n");
        $raw = stream_get_contents($socket);
        fclose($socket);

        return is_string($raw) ? $raw : '';
    }

    private function extractSessionIdFromRaw(string $raw): ?string
    {
        if (preg_match('/Set-Cookie:\s*SessionID=([^;\s]+)/i', $raw, $matches) === 1) {
            return $matches[1];
        }

        $parts = preg_split('/(?=HTTP\/1\.0 )/', $raw) ?: [];

        foreach ($parts as $part) {
            if (preg_match('/Set-Cookie:\s*SessionID=([^;\s]+)/i', $part, $matches) === 1) {
                return $matches[1];
            }
        }

        return null;
    }

    private function attachSessionCookie(CookieJar $jar, string $host, string $sessionId): void
    {
        $jar->setCookie(new SetCookie([
            'Name' => 'SessionID',
            'Value' => $sessionId,
            'Domain' => $host,
            'Path' => '/',
        ]));
    }

    private function credentialHint(BiometricDevice $device): string
    {
        $envSet = config('biometric.device_web.default_password') !== '';
        $metaSet = is_string($device->metadata['web_password'] ?? null)
            && $device->metadata['web_password'] !== '';

        if (! $envSet && ! $metaSet) {
            return 'Add BIOMETRIC_DEVICE_WEB_USERNAME and BIOMETRIC_DEVICE_WEB_PASSWORD to .env (exact Login ID/Password from http://'.$device->host.'/csl/login), then run: php artisan config:clear. Or save Web login password on the device in Biometric → Devices.';
        }

        if ($metaSet && ! $envSet) {
            return 'Password is stored on the device record. If you changed .env only, edit the device in HRIS and re-enter Web login password, then Save.';
        }

        return 'Run: php artisan config:clear — then: php artisan biometric:test-device-web '.$device->id;
    }

    private function createClient(CookieJar $jar): Client
    {
        return new Client([
            'timeout' => (int) config('biometric.device_web.timeout', 30),
            'cookies' => $jar,
            'allow_redirects' => false,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (compatible; HRIS-Biometric/1.0)',
            ],
        ]);
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    private function credentialAttempts(BiometricDevice $device): array
    {
        $attempts = [];

        $metadataPassword = is_string($device->metadata['web_password'] ?? null)
            ? $device->metadata['web_password']
            : null;

        if ($metadataPassword !== null && $metadataPassword !== '') {
            $attempts['device_record'] = [
                $device->deviceWebUsername(),
                $metadataPassword,
            ];
        }

        $envPassword = (string) config('biometric.device_web.default_password', '');

        if ($envPassword !== '') {
            $attempts['env'] = [
                trim((string) config('biometric.device_web.default_username', 'administrator')),
                $envPassword,
            ];
        }

        if ($attempts !== []) {
            return $this->uniqueCredentialAttempts($attempts);
        }

        return $this->uniqueCredentialAttempts([
            'default_empty' => [$device->deviceWebUsername(), ''],
        ]);
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $attempts
     * @return array<string, array{0: string, 1: string}>
     */
    private function uniqueCredentialAttempts(array $attempts): array
    {
        $unique = [];
        $seen = [];

        foreach ($attempts as $label => [$username, $password]) {
            $key = $username."\0".$password;

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[$label] = [$username, $password];
        }

        return $unique;
    }

    private function bootstrapSession(Client $client, string $baseUrl): void
    {
        $client->get($baseUrl.'/csl/login', ['http_errors' => false]);
    }

    private function isAuthenticatedCheckResponse(string $body): bool
    {
        if ($this->isLoginFailureResponse($body) || $this->isLoginPage($body)) {
            return false;
        }

        return str_contains($body, "location.href='/'")
            || str_contains($body, 'location.href="/"')
            || str_contains(strtolower($body), 'frameset')
            || strlen($body) < 400;
    }

    private function isLoginFailureResponse(string $body): bool
    {
        if ($this->isLoginPage($body)) {
            return true;
        }

        return str_contains($body, 'Error Input')
            || str_contains(strtolower($body), "alert('failed");
    }

    private function isLoginPage(string $html): bool
    {
        $lower = strtolower($html);

        return str_contains($lower, 'name=myform')
            && str_contains($lower, '/csl/check')
            && str_contains($lower, 'name=username');
    }

    private function looksLikeReportIndex(string $html): bool
    {
        $lower = strtolower($html);

        return str_contains($lower, 'name=mainform')
            && str_contains($lower, 'name=sdate')
            && str_contains($lower, 'name=uid');
    }

    private function looksLikeReport(string $html): bool
    {
        if ($this->isLoginPage($html) || $this->isRedirectStub($html)) {
            return false;
        }

        $lower = strtolower($html);

        if (! str_contains($lower, 'id number') && ! str_contains($lower, 'id no')) {
            return false;
        }

        return preg_match('/<tr[^>]*>.*?<td[^>]*>\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/is', $html) === 1
            || preg_match('/<tr[^>]*>.*?<td[^>]*>\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/is', $html) === 1;
    }

    private function isRedirectStub(string $html): bool
    {
        return str_contains($html, 'location.href')
            && ! str_contains(strtolower($html), '<table');
    }

    /**
     * ZKTeco HTTP/1.0 may concatenate multiple responses in one body.
     */
    private function normalizeResponseBody(string $body): string
    {
        $bodies = ZkDeviceWebHttpTransport::bodiesFromPsrBody($body);

        return $bodies === [] ? $body : $bodies[array_key_last($bodies)];
    }
}
