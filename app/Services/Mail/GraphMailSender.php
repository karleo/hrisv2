<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;

class GraphMailSender
{
    /**
     * @param  array{tenant_id: string, client_id: string, client_secret: string, sender: string}  $graphConfig
     */
    public function send(RawMessage $message, array $graphConfig): void
    {
        if (! $message instanceof Email) {
            throw new \RuntimeException('Only Email messages are supported for Microsoft Graph transport.');
        }

        $token = $this->acquireAccessToken($graphConfig);

        $endpoint = 'https://graph.microsoft.com/v1.0/users/'.rawurlencode($graphConfig['sender']).'/sendMail';

        $payload = [
            'message' => [
                'subject' => (string) $message->getSubject(),
                'body' => [
                    'contentType' => $message->getHtmlBody() !== null ? 'HTML' : 'Text',
                    'content' => (string) ($message->getHtmlBody() ?? $message->getTextBody() ?? ''),
                ],
                'toRecipients' => $this->mapRecipients($message->getTo()),
                'ccRecipients' => $this->mapRecipients($message->getCc()),
                'bccRecipients' => $this->mapRecipients($message->getBcc()),
            ],
            'saveToSentItems' => true,
        ];

        Http::asJson()
            ->withToken($token)
            ->post($endpoint, $payload)
            ->throw();
    }

    /**
     * @param  array{tenant_id: string, client_id: string, client_secret: string, sender: string}  $graphConfig
     */
    private function acquireAccessToken(array $graphConfig): string
    {
        $tokenUrl = 'https://login.microsoftonline.com/'.rawurlencode($graphConfig['tenant_id']).'/oauth2/v2.0/token';

        $response = Http::asForm()
            ->post($tokenUrl, [
                'client_id' => $graphConfig['client_id'],
                'client_secret' => $graphConfig['client_secret'],
                'grant_type' => 'client_credentials',
                'scope' => 'https://graph.microsoft.com/.default',
            ])
            ->throw()
            ->json();

        $token = $response['access_token'] ?? null;
        if (! is_string($token) || $token === '') {
            throw new \RuntimeException('Unable to acquire Microsoft Graph access token.');
        }

        return $token;
    }

    /**
     * @param  list<Address>|Address[]  $addresses
     * @return array<int, array{emailAddress: array{address: string, name: string}}>
     */
    private function mapRecipients(array $addresses): array
    {
        return array_values(array_map(static function (Address $address): array {
            return [
                'emailAddress' => [
                    'address' => $address->getAddress(),
                    'name' => $address->getName(),
                ],
            ];
        }, $addresses));
    }
}
