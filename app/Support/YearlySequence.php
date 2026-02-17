<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final class YearlySequence
{
    /**
     * Atomically increments and returns the next sequence number for a given key + year.
     */
    public static function next(string $key, int $year): int
    {
        return (int) DB::transaction(function () use ($key, $year) {
            $row = DB::table('yearly_sequences')
                ->where('key', $key)
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if ($row === null) {
                try {
                    DB::table('yearly_sequences')->insert([
                        'key' => $key,
                        'year' => $year,
                        'last_number' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    return 1;
                } catch (QueryException) {
                    // Another request inserted the row concurrently. Re-lock and continue.
                    $row = DB::table('yearly_sequences')
                        ->where('key', $key)
                        ->where('year', $year)
                        ->lockForUpdate()
                        ->first();

                    if ($row === null) {
                        throw new \RuntimeException('Failed to initialize yearly sequence row.');
                    }
                }
            }

            $next = ((int) $row->last_number) + 1;

            DB::table('yearly_sequences')
                ->where('id', $row->id)
                ->update([
                    'last_number' => $next,
                    'updated_at' => now(),
                ]);

            return $next;
        });
    }
}

