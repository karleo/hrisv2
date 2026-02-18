<?php

namespace App\Support;

use Illuminate\Support\Carbon;

final class DocumentCode
{
    /**
     * Generates Leave Request code in format: PRL-YYYY-#### (yearly sequence).
     */
    public static function leaveRequest(?string $date = null): string
    {
        $year = null;

        if (! empty($date)) {
            try {
                $year = Carbon::parse($date)->year;
            } catch (\Throwable) {
                $year = null;
            }
        }

        $year = $year ?: now()->year;

        $next = YearlySequence::next('leave_request', $year);

        return sprintf('PRL-%d-%04d', $year, $next);
    }

    /**
     * Generates Employee Request code in format: PRLER-YYYY-#### (yearly sequence).
     */
    public static function employeeRequest(?string $date = null): string
    {
        $year = null;

        if (! empty($date)) {
            try {
                $year = Carbon::parse($date)->year;
            } catch (\Throwable) {
                $year = null;
            }
        }

        $year = $year ?: now()->year;

        $next = YearlySequence::next('employee_request', $year);

        return sprintf('PRLER-%d-%04d', $year, $next);
    }

    /**
     * Generates IT Asset Request code in format: PRLIT-YYYY-#### (yearly sequence).
     */
    public static function itAssetRequest(?string $date = null): string
    {
        $year = null;

        if (! empty($date)) {
            try {
                $year = Carbon::parse($date)->year;
            } catch (\Throwable) {
                $year = null;
            }
        }

        $year = $year ?: now()->year;

        $next = YearlySequence::next('it_asset_request', $year);

        return sprintf('PRLIT-%d-%04d', $year, $next);
    }
}
