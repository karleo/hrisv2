<?php

namespace App\Console\Commands;

use App\Services\Storage\StorageLinkMaintenanceService;
use Illuminate\Console\Command;
use RuntimeException;

class MaintainStorageLinkCommand extends Command
{
    /**
     * storage:maintain — run after deploy or when uploads return 404.
     *
     * Local (FILESYSTEM_DISK=local): creates public/storage -> storage/app/public.
     * S3 (FILESYSTEM_DISK=s3): verifies bucket access; no symlink on the server.
     */
    protected $signature = 'storage:maintain {--force : Recreate symbolic links when they are missing or incorrect}';

    protected $description = 'Maintain storage for local disks (symlink) or verify AWS S3 bucket connectivity';

    public function handle(StorageLinkMaintenanceService $storageLinkMaintenance): int
    {
        $mode = $storageLinkMaintenance->usesObjectStorage()
            ? 'AWS S3 object storage'
            : 'local disk';

        $this->info("Running storage maintenance ({$mode}).");
        $this->newLine();

        try {
            foreach ($storageLinkMaintenance->run((bool) $this->option('force')) as $message) {
                $this->line($message);
            }
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());
            $this->newLine();
            $this->comment('Instructions:');
            foreach ($storageLinkMaintenance->instructions() as $instruction) {
                $this->line("  • {$instruction}");
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->comment('Instructions:');
        foreach ($storageLinkMaintenance->instructions() as $instruction) {
            $this->line("  • {$instruction}");
        }

        return self::SUCCESS;
    }
}
