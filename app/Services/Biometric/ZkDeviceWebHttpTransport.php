<?php

namespace App\Services\Biometric;

/**
 * Minimal HTTP/1.0 client for ZKTeco iClock web UI (no cookies; often multiple responses per read).
 */
final class ZkDeviceWebHttpTransport
{
    private mixed $socket = null;

    public function __construct(
        private readonly string $host,
        private readonly int $port = 80,
        private readonly int $timeoutSeconds = 30,
    ) {}

    public function connect(): void
    {
        $this->close();

        $errno = 0;
        $errstr = '';
        $socket = @fsockopen($this->host, $this->port, $errno, $errstr, $this->timeoutSeconds);

        if (! is_resource($socket)) {
            throw new \RuntimeException("Cannot connect to {$this->host}:{$this->port}: {$errstr}");
        }

        stream_set_timeout($socket, $this->timeoutSeconds);
        $this->socket = $socket;
    }

    public function close(): void
    {
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }

        $this->socket = null;
    }

    /**
     * @param  array<string, string>  $formFields
     * @return list<string> Raw HTTP response blobs (headers + body)
     */
    public function request(string $method, string $path, ?array $formFields = null, bool $keepAlive = false): array
    {
        if (! is_resource($this->socket)) {
            $this->connect();
        }

        $payload = '';

        if ($formFields !== null) {
            $payload = http_build_query($formFields);
        }

        $headers = "Host: {$this->host}\r\n";
        $headers .= "User-Agent: Mozilla/5.0 (compatible; HRIS-Biometric/1.0)\r\n";
        $headers .= 'Connection: '.($keepAlive ? 'Keep-Alive' : 'close')."\r\n";

        if ($payload !== '') {
            $headers .= "Content-Type: application/x-www-form-urlencoded\r\n";
            $headers .= 'Content-Length: '.strlen($payload)."\r\n";
        }

        $rawRequest = strtoupper($method).' '.$path." HTTP/1.0\r\n{$headers}\r\n{$payload}";
        fwrite($this->socket, $rawRequest);

        return $this->readResponses($keepAlive);
    }

    /**
     * @return list<string>
     */
    private function readResponses(bool $keepConnectionOpen): array
    {
        if (! is_resource($this->socket)) {
            return [];
        }

        $buffer = '';
        $responses = [];

        while (! feof($this->socket)) {
            $chunk = fread($this->socket, 8192);

            if ($chunk === false || $chunk === '') {
                break;
            }

            $buffer .= $chunk;

            while (($response = $this->extractCompleteResponse($buffer)) !== null) {
                $responses[] = $response;

                if ($keepConnectionOpen) {
                    return $responses;
                }
            }

            if ($keepConnectionOpen && $responses !== []) {
                return $responses;
            }
        }

        if (trim($buffer) !== '') {
            $responses[] = $buffer;
        }

        if (! $keepConnectionOpen) {
            $this->close();
        }

        return $responses;
    }

    private function extractCompleteResponse(string &$buffer): ?string
    {
        if (! preg_match('/\r\n\r\n/', $buffer, $matches, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        $headerEnd = $matches[0][1] + strlen($matches[0][0]);
        $headerBlock = substr($buffer, 0, $headerEnd);
        $body = substr($buffer, $headerEnd);

        $contentLength = 0;

        if (preg_match('/Content-Length:\s*(\d+)/i', $headerBlock, $lengthMatch) === 1) {
            $contentLength = (int) $lengthMatch[1];
        }

        if (strlen($body) < $contentLength) {
            return null;
        }

        $response = substr($buffer, 0, $headerEnd + $contentLength);
        $buffer = substr($buffer, $headerEnd + $contentLength);

        return $response;
    }

    public function responseBody(string $rawResponse): string
    {
        $parts = preg_split('/\r\n\r\n/', $rawResponse, 2);

        return $parts[1] ?? '';
    }

    /**
     * ZKTeco devices may concatenate multiple HTTP messages in one Guzzle body.
     *
     * @return list<string> HTML bodies (last is usually the meaningful page)
     */
    public static function bodiesFromPsrBody(string $body): array
    {
        $chunks = preg_split('/(?=HTTP\/1\.[01] )/', $body) ?: [];
        $bodies = [];

        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);

            if ($chunk === '') {
                continue;
            }

            $parts = preg_split('/\r\n\r\n/', $chunk, 2);
            $html = $parts[1] ?? '';

            if ($html !== '') {
                $bodies[] = $html;
            }
        }

        if ($bodies === [] && $body !== '') {
            $bodies[] = $body;
        }

        return $bodies;
    }
}
