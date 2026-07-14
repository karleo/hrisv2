<?php

namespace PrimeLogistics\ZkBiometricClient\WebReport;

use Carbon\CarbonInterface;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Cookie\SetCookie;
use GuzzleHttp\Exception\GuzzleException;
use PrimeLogistics\ZkBiometricClient\Device\DeviceConfig;
use PrimeLogistics\ZkBiometricClient\Punch\PunchClock;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;
use Psr\Http\Message\ResponseInterface;
use RuntimeException;

/**
 * Pulls attendance from a ZKTeco iClock device web report (LAN).
 */
final class WebReportClient
{
    private ?string $lastSessionIdUsed = null;

    public function __construct(
        private readonly HtmlParser $parser = new HtmlParser,
    ) {}

    public function lastSessionIdUsed(): ?string
    {
        return $this->lastSessionIdUsed;
    }

    /**
     * @return list<PunchRecord>
     */
    public function fetchPunches(DeviceConfig $device, CarbonInterface $from, CarbonInterface $until): array
    {
        $timezone = $device->timezone;
        $fromLocal = $from->copy()->timezone($timezone)->startOfDay();
        $untilLocal = $until->copy()->timezone($timezone)->endOfDay();

        $html = $this->fetchReportHtml($device, $fromLocal, $untilLocal);

        if ($html === '') {
            return [];
        }

        $parseResult = $this->parser->parseWithDiagnostics($html, $timezone);

        $fromBound = $fromLocal->format('Y-m-d H:i:s');
        $untilBound = $untilLocal->format('Y-m-d H:i:s');

        return array_values(array_filter(
            $parseResult->punches,
            fn (PunchRecord $punch): bool => ! PunchClock::isBefore($punch->punchedAtStorage, $fromBound)
                && ! PunchClock::isAfter($punch->punchedAtStorage, $untilBound),
        ));
    }

    /**
     * Fetch punches newer than a watermark (exclusive). Uses day-range report then filters.
     *
     * @return list<PunchRecord>
     */
    public function fetchPunchesAfter(DeviceConfig $device, ?string $watermarkExclusive, CarbonInterface $until): array
    {
        $timezone = $device->timezone;

        if ($watermarkExclusive !== null && $watermarkExclusive !== '') {
            $from = PunchClock::comparisonCarbon($watermarkExclusive, $timezone);
        } else {
            $from = $until->copy()->timezone($timezone)->subDays(7)->startOfDay();
        }

        $punches = $this->fetchPunches($device, $from, $until);

        if ($watermarkExclusive === null || $watermarkExclusive === '') {
            return $punches;
        }

        return array_values(array_filter(
            $punches,
            fn (PunchRecord $punch): bool => PunchClock::isAfter($punch->punchedAtStorage, $watermarkExclusive),
        ));
    }

    private function fetchReportHtml(DeviceConfig $device, CarbonInterface $from, CarbonInterface $until): string
    {
        $baseUrl = $device->baseUrl();
        $client = $this->authenticateClient($baseUrl, $device);
        $this->bootstrapSession($client, $baseUrl);

        $userIds = $this->collectDeviceUserIds($client, $baseUrl);

        if ($userIds === []) {
            throw new RuntimeException(
                'Could not read device user IDs from '.$baseUrl.'.',
            );
        }

        $fromDate = $from->format('Y-m-d');
        $untilDate = $until->format('Y-m-d');
        $postBody = $this->buildReportSearchBody($fromDate, $untilDate, $userIds);

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

        $html = HttpTransport::normalizeResponseBody((string) $response->getBody());

        if ($this->isLoginPage($html)) {
            throw new RuntimeException('Device returned the login page instead of the attendance report.');
        }

        if ($this->isRedirectStub($html)) {
            throw new RuntimeException('Device report session expired. Update SessionID and retry.');
        }

        if ($this->countReportDataRows($html) < 1) {
            return '';
        }

        return $html;
    }

    /**
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

        return HttpTransport::normalizeResponseBody($body);
    }

    private function authenticateClient(string $baseUrl, DeviceConfig $device): Client
    {
        $savedSessionId = $this->normalizeSessionId($device->webSessionId);

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
        }

        $client = $this->attemptLogin($baseUrl, $device, null);

        if ($client !== null) {
            return $client;
        }

        throw new RuntimeException(
            'Could not log in or open the attendance report at '.$baseUrl.'. '
            .'Check RELAY_DEVICE_WEB_USERNAME / RELAY_DEVICE_WEB_PASSWORD (or SessionID).',
        );
    }

    private function attemptLogin(string $baseUrl, DeviceConfig $device, ?string $initialSessionId): ?Client
    {
        $host = parse_url($baseUrl, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            throw new RuntimeException('Device host is invalid for web report pull.');
        }

        foreach ($this->credentialAttempts($device) as $label => [$username, $password]) {
            $jar = new CookieJar;
            $client = $this->createClient($jar, $device->timeoutSeconds);

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

                $checkBody = HttpTransport::normalizeResponseBody((string) $checkResponse->getBody());
            } catch (GuzzleException $exception) {
                throw new RuntimeException('Cannot reach device: '.$exception->getMessage(), previous: $exception);
            }

            if ($this->isLoginFailureResponse($checkBody)) {
                continue;
            }

            $sessionId = $this->resolveSessionId($jar, $checkResponse, $initialSessionId, $host);

            if ($sessionId !== null) {
                $this->lastSessionIdUsed = $sessionId;
            }

            if (! $this->isAuthenticatedCheckResponse($checkBody) && $sessionId === null && $this->isLoginPage($checkBody)) {
                continue;
            }

            $indexHtml = $this->fetchReportIndexHtml($client, $baseUrl);

            if ($this->looksLikeReportIndex($indexHtml)) {
                return $client;
            }
        }

        return null;
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    private function credentialAttempts(DeviceConfig $device): array
    {
        return [
            'config' => [$device->username, $device->password],
        ];
    }

    private function resolveSessionId(CookieJar $jar, ResponseInterface $checkResponse, ?string $fallback, string $host): ?string
    {
        foreach ($jar->toArray() as $cookie) {
            if (($cookie['Name'] ?? '') === 'SessionID' && is_string($cookie['Value'] ?? null) && $cookie['Value'] !== '') {
                return $cookie['Value'];
            }
        }

        foreach ($checkResponse->getHeader('Set-Cookie') as $cookieHeader) {
            if (preg_match('/SessionID=([^;\s]+)/i', $cookieHeader, $matches) === 1) {
                $this->attachSessionCookie($jar, $host, $matches[1]);

                return $matches[1];
            }
        }

        return $fallback;
    }

    private function normalizeSessionId(?string $sessionId): ?string
    {
        if ($sessionId === null) {
            return null;
        }

        $trimmed = trim($sessionId);

        return preg_match('/^\d+$/', $trimmed) === 1 ? $trimmed : null;
    }

    private function tryAcquireOptionalSessionId(string $baseUrl, DeviceConfig $device): ?string
    {
        $jar = new CookieJar;
        $client = $this->createClient($jar, $device->timeoutSeconds);

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

    private function attachSessionCookie(CookieJar $jar, string $host, string $sessionId): void
    {
        $jar->setCookie(new SetCookie([
            'Name' => 'SessionID',
            'Value' => $sessionId,
            'Domain' => $host,
            'Path' => '/',
        ]));
    }

    private function createClient(CookieJar $jar, int $timeout): Client
    {
        return new Client([
            'timeout' => $timeout,
            'cookies' => $jar,
            'allow_redirects' => false,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (compatible; Biometric-Relay/1.0)',
            ],
        ]);
    }

    private function bootstrapSession(Client $client, string $baseUrl): void
    {
        $client->get($baseUrl.'/csl/login', ['http_errors' => false]);
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

    private function isRedirectStub(string $html): bool
    {
        return str_contains($html, 'location.href')
            && ! str_contains(strtolower($html), '<table');
    }
}
