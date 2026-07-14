<?php

namespace PrimeLogistics\ZkBiometricClient\Attlog;

use PrimeLogistics\ZkBiometricClient\Punch\PunchDirection;
use PrimeLogistics\ZkBiometricClient\Punch\PunchRecord;

final class AttlogFormatter
{
    public function line(PunchRecord $punch): string
    {
        $status = $punch->rawStatus ?? match ($punch->direction) {
            PunchDirection::In => 0,
            PunchDirection::Out => 1,
        };

        $verify = $punch->verifyType ?? 1;
        $work = $punch->workCode ?? '0';

        return "{$punch->deviceUserId}\t{$punch->punchedAtStorage}\t{$status}\t{$verify}\t0\t{$work}";
    }

    /**
     * @param  list<PunchRecord>  $punches
     */
    public function body(array $punches): string
    {
        return implode("\n", array_map(fn (PunchRecord $punch): string => $this->line($punch), $punches));
    }

    public function cdataEndpoint(string $baseOrCdataUrl, string $serialNumber): string
    {
        $url = rtrim($baseOrCdataUrl, '/');

        if (! str_contains($url, '/iclock/cdata')) {
            $url .= '/iclock/cdata';
        }

        return $url.'?SN='.rawurlencode($serialNumber).'&table=ATTLOG';
    }
}
