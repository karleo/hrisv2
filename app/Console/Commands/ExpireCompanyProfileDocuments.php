<?php

namespace App\Console\Commands;

use App\Models\CompanyProfileDocument;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ExpireCompanyProfileDocuments extends Command
{
    protected $signature = 'company-profile-documents:expire';

    protected $description = 'Mark active company profile documents as expired when their expiry date has passed.';

    public function handle(): int
    {
        $today = Carbon::today();

        $expiredCount = CompanyProfileDocument::query()
            ->active()
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', $today->toDateString())
            ->update([
                'status' => CompanyProfileDocument::STATUS_EXPIRED,
                'archived_at' => null,
            ]);

        $this->info("Marked {$expiredCount} company profile document(s) as expired.");

        return self::SUCCESS;
    }
}
