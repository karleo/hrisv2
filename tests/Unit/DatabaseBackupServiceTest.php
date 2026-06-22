<?php

namespace Tests\Unit;

use App\Services\Database\DatabaseBackupService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DatabaseBackupServiceTest extends TestCase
{
    private string $sqlitePath;

    private string $backupDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sqlitePath = storage_path('app/testing/database-backup.sqlite');
        $this->backupDirectory = storage_path('app/backups/database');

        File::ensureDirectoryExists(dirname($this->sqlitePath));
        File::put($this->sqlitePath, 'sqlite-backup-test');

        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite.database', $this->sqlitePath);

        if (is_dir($this->backupDirectory)) {
            File::deleteDirectory($this->backupDirectory);
        }
    }

    protected function tearDown(): void
    {
        if (is_file($this->sqlitePath)) {
            File::delete($this->sqlitePath);
        }

        if (is_dir($this->backupDirectory)) {
            File::deleteDirectory($this->backupDirectory);
        }

        foreach (glob($this->sqlitePath.'.before-restore-*') ?: [] as $snapshot) {
            File::delete($snapshot);
        }

        parent::tearDown();
    }

    public function test_it_can_backup_and_restore_sqlite_database(): void
    {
        $service = app(DatabaseBackupService::class);

        $filename = $service->backup();
        $this->assertStringEndsWith('.sqlite', $filename);

        $backupPath = $this->backupDirectory.'/'.$filename;
        $this->assertTrue(is_file($backupPath));

        File::put($this->sqlitePath, 'corrupted-database');

        $uploadedBackup = new UploadedFile(
            $backupPath,
            $filename,
            'application/octet-stream',
            null,
            true,
        );

        $service->restore($uploadedBackup);

        $this->assertSame('sqlite-backup-test', File::get($this->sqlitePath));
    }
}
