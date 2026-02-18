<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('id');
        });

        // Backfill existing rows (if any) with PRLIT-YYYY-#### codes.
        $countersByYear = [];

        DB::table('it_asset_requests')
            ->whereNull('code')
            ->orderBy('id')
            ->select(['id', 'date', 'created_at'])
            ->chunkById(200, function ($rows) use (&$countersByYear): void {
                foreach ($rows as $row) {
                    $year = null;

                    if (! empty($row->date) && is_string($row->date)) {
                        // Expecting YYYY-MM-DD
                        $year = (int) substr($row->date, 0, 4);
                    }

                    if (empty($year) && ! empty($row->created_at)) {
                        $year = Carbon::parse($row->created_at)->year;
                    }

                    $year = $year ?: now()->year;

                    $countersByYear[$year] = ($countersByYear[$year] ?? 0) + 1;
                    $seq = $countersByYear[$year];

                    $code = sprintf('PRLIT-%d-%04d', $year, $seq);

                    DB::table('it_asset_requests')
                        ->where('id', $row->id)
                        ->update(['code' => $code]);
                }
            });

        // Seed yearly_sequences table so future inserts continue the sequence.
        foreach ($countersByYear as $year => $lastNumber) {
            DB::table('yearly_sequences')->updateOrInsert(
                ['key' => 'it_asset_request', 'year' => (int) $year],
                [
                    'last_number' => (int) $lastNumber,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->unique('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('it_asset_requests', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
