<?php

namespace App\Console\Commands;

use App\Models\EmployeeConversation;
use App\Models\EmployeeMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneOldEmployeeMessages extends Command
{
    protected $signature = 'employee-messages:prune-old {--days=7 : Delete messages older than this many days}';

    protected $description = 'Delete employee chat messages older than the retention window.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $deleted = 0;

        EmployeeMessage::query()
            ->where('created_at', '<', $cutoff)
            ->chunkById(100, function ($messages) use (&$deleted): void {
                foreach ($messages as $message) {
                    if (is_string($message->attachment_path) && $message->attachment_path !== '') {
                        Storage::disk('public')->delete($message->attachment_path);
                    }
                }

                $deleted += EmployeeMessage::query()
                    ->whereKey($messages->pluck('id'))
                    ->delete();
            });

        EmployeeConversation::query()
            ->with('messages')
            ->chunkById(100, function ($conversations): void {
                foreach ($conversations as $conversation) {
                    $lastMessage = $conversation
                        ->messages()
                        ->latest()
                        ->first();

                    $conversation->forceFill([
                        'last_message_id' => $lastMessage?->id,
                        'last_message_at' => $lastMessage?->created_at,
                    ])->save();
                }
            });

        $this->info("Deleted {$deleted} old employee message(s).");

        return self::SUCCESS;
    }
}
