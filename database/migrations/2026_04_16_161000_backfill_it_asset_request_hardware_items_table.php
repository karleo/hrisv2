<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        DB::table('it_asset_requests')
            ->select(['id', 'hardware_ids', 'serial_number'])
            ->orderBy('id')
            ->chunkById(200, function ($requests) use ($now): void {
                foreach ($requests as $request) {
                    $hardwareIds = $this->parseHardwareIds($request->hardware_ids);
                    if ($hardwareIds === []) {
                        continue;
                    }

                    $alreadyBackfilled = DB::table('it_asset_request_hardware_items')
                        ->where('it_asset_request_id', $request->id)
                        ->exists();

                    if ($alreadyBackfilled) {
                        continue;
                    }

                    $singleSerial = count($hardwareIds) === 1 && filled($request->serial_number)
                        ? trim((string) $request->serial_number)
                        : null;

                    $rows = [];
                    foreach ($hardwareIds as $hardwareId) {
                        $rows[] = [
                            'it_asset_request_id' => $request->id,
                            'hardware_id' => $hardwareId,
                            'serial_number' => $singleSerial,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }

                    DB::table('it_asset_request_hardware_items')->insert($rows);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('it_asset_request_hardware_items')->delete();
    }

    /**
     * @return array<int, int>
     */
    private function parseHardwareIds(mixed $hardwareIdsRaw): array
    {
        if (is_array($hardwareIdsRaw)) {
            $decoded = $hardwareIdsRaw;
        } elseif (is_string($hardwareIdsRaw) && $hardwareIdsRaw !== '') {
            $decoded = json_decode($hardwareIdsRaw, true);
        } else {
            $decoded = [];
        }

        if (! is_array($decoded)) {
            return [];
        }

        $normalized = [];
        foreach ($decoded as $hardwareIdRaw) {
            $hardwareId = (int) $hardwareIdRaw;
            if ($hardwareId > 0) {
                $normalized[$hardwareId] = $hardwareId;
            }
        }

        return array_values($normalized);
    }
};
