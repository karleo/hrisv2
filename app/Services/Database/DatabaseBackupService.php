<?php

namespace App\Services\Database;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatabaseBackupService
{
    private const BACKUP_DIRECTORY = 'backups/database';

    /**
     * @return list<array{name: string, size: int, created_at: string}>
     */
    public function listBackups(): array
    {
        $directory = $this->backupDirectory();

        if (! is_dir($directory)) {
            return [];
        }

        $files = collect(File::files($directory))
            ->sortByDesc(fn ($file) => $file->getMTime())
            ->values();

        return $files->map(function ($file): array {
            return [
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'created_at' => Carbon::createFromTimestamp($file->getMTime())->toIso8601String(),
            ];
        })->all();
    }

    /**
     * Create a database backup file under storage/app/backups/database.
     */
    public function backup(): string
    {
        $this->ensureBackupDirectoryExists();

        return match ($this->driver()) {
            'sqlite' => $this->backupSqlite(),
            'mysql', 'mariadb' => $this->backupMysql(),
            default => throw new RuntimeException("Database driver [{$this->driver()}] is not supported for backup."),
        };
    }

    /**
     * Replace the active database with a previously uploaded backup file.
     */
    public function restore(UploadedFile $backupFile): void
    {
        $extension = strtolower($backupFile->getClientOriginalExtension());

        match ($this->driver()) {
            'sqlite' => $this->restoreSqlite($backupFile, $extension),
            'mysql', 'mariadb' => $this->restoreMysql($backupFile, $extension),
            default => throw new RuntimeException("Database driver [{$this->driver()}] is not supported for restore."),
        };
    }

    /**
     * Restore from an existing backup file already stored on the server.
     */
    public function restoreFromStoredBackup(string $filename): void
    {
        $path = $this->resolveBackupPath($filename);

        if (! is_file($path)) {
            throw new RuntimeException("Backup file [{$filename}] was not found.");
        }

        $uploaded = new UploadedFile(
            $path,
            basename($path),
            'application/octet-stream',
            null,
            true,
        );

        $this->restore($uploaded);
    }

    public function downloadResponse(string $filename): StreamedResponse
    {
        $path = $this->resolveBackupPath($filename);

        if (! is_file($path)) {
            throw new RuntimeException("Backup file [{$filename}] was not found.");
        }

        return response()->streamDownload(function () use ($path): void {
            $stream = fopen($path, 'rb');
            if ($stream === false) {
                throw new RuntimeException('Unable to read the backup file.');
            }

            fpassthru($stream);
            fclose($stream);
        }, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    public function connectionName(): string
    {
        return (string) config('database.default', 'sqlite');
    }

    public function driver(): string
    {
        $connection = $this->connectionName();

        return (string) config("database.connections.{$connection}.driver", 'sqlite');
    }

    private function backupSqlite(): string
    {
        $databasePath = $this->sqliteDatabasePath();

        if (! is_file($databasePath)) {
            throw new RuntimeException("SQLite database file not found at [{$databasePath}].");
        }

        $filename = $this->buildFilename('sqlite');
        $destination = $this->backupDirectory().'/'.$filename;

        if (! copy($databasePath, $destination)) {
            throw new RuntimeException('Unable to copy the SQLite database file for backup.');
        }

        return $filename;
    }

    private function backupMysql(): string
    {
        $filename = $this->buildFilename('sql');
        $destination = $this->backupDirectory().'/'.$filename;

        try {
            $this->backupMysqlViaCli($destination);
        } catch (RuntimeException) {
            $this->backupMysqlViaPhp($destination);
        }

        if (! is_file($destination) || filesize($destination) === 0) {
            throw new RuntimeException('Backup file was not created or is empty.');
        }

        return $filename;
    }

    private function backupMysqlViaCli(string $destination): void
    {
        $connection = $this->mysqlConnectionConfig();
        $binary = $this->resolveMysqlBinary('mysqldump');

        $command = [
            $binary,
            '--host='.(string) ($connection['host'] ?? '127.0.0.1'),
            '--port='.(string) ($connection['port'] ?? '3306'),
            '--user='.(string) ($connection['username'] ?? 'root'),
            '--single-transaction',
            '--routines',
            '--triggers',
            '--no-tablespaces',
            (string) ($connection['database'] ?? ''),
        ];

        $result = $this->runMysqlProcess($command, $connection);
        if (! $result->successful()) {
            throw new RuntimeException(trim($result->errorOutput()) ?: 'mysqldump failed to create a database backup.');
        }

        File::put($destination, $result->output());
    }

    private function backupMysqlViaPhp(string $destination): void
    {
        $connection = $this->mysqlConnectionConfig();
        $database = (string) ($connection['database'] ?? '');
        $tableKey = 'Tables_in_'.$database;
        $tables = DB::select('SHOW TABLES');
        $sql = "-- HRIS database backup\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n";

        foreach ($tables as $table) {
            $tableName = $table->{$tableKey} ?? null;
            if (! is_string($tableName) || $tableName === '') {
                continue;
            }

            $create = DB::selectOne('SHOW CREATE TABLE `'.$tableName.'`');
            $createStatement = $create->{'Create Table'} ?? null;
            if (! is_string($createStatement)) {
                continue;
            }

            $sql .= "\nDROP TABLE IF EXISTS `{$tableName}`;\n{$createStatement};\n\n";

            DB::table($tableName)->orderBy(DB::raw('1'))->chunk(200, function ($rows) use (&$sql, $tableName): void {
                foreach ($rows as $row) {
                    $values = collect((array) $row)->map(function ($value): string {
                        if ($value === null) {
                            return 'NULL';
                        }

                        if (is_bool($value)) {
                            return $value ? '1' : '0';
                        }

                        if (is_int($value) || is_float($value)) {
                            return (string) $value;
                        }

                        return "'".str_replace("'", "''", (string) $value)."'";
                    })->implode(', ');

                    $columns = implode('`, `', array_keys((array) $row));
                    $sql .= "INSERT INTO `{$tableName}` (`{$columns}`) VALUES ({$values});\n";
                }
            });
        }

        $sql .= "\nSET FOREIGN_KEY_CHECKS=1;\n";
        File::put($destination, $sql);
    }

    private function restoreSqlite(UploadedFile $backupFile, string $extension): void
    {
        if (! in_array($extension, ['sqlite', 'db'], true)) {
            throw new RuntimeException('SQLite restore expects a .sqlite or .db backup file.');
        }

        $databasePath = $this->sqliteDatabasePath();
        $temporaryPath = $backupFile->getRealPath();

        if (! is_string($temporaryPath) || ! is_file($temporaryPath)) {
            throw new RuntimeException('Uploaded backup file is not readable.');
        }

        DB::disconnect($this->connectionName());
        app('db')->purge($this->connectionName());

        if (is_file($databasePath)) {
            copy($databasePath, $databasePath.'.before-restore-'.now()->format('YmdHis'));
        }

        if (! copy($temporaryPath, $databasePath)) {
            throw new RuntimeException('Unable to restore the SQLite database file.');
        }
    }

    private function restoreMysql(UploadedFile $backupFile, string $extension): void
    {
        if ($extension !== 'sql') {
            throw new RuntimeException('MySQL restore expects a .sql backup file.');
        }

        $temporaryPath = $backupFile->getRealPath();

        if (! is_string($temporaryPath) || ! is_file($temporaryPath)) {
            throw new RuntimeException('Uploaded backup file is not readable.');
        }

        try {
            $this->restoreMysqlViaCli($temporaryPath);
        } catch (RuntimeException) {
            $this->restoreMysqlViaPhp($temporaryPath);
        }
    }

    private function restoreMysqlViaCli(string $sqlPath): void
    {
        $connection = $this->mysqlConnectionConfig();
        $binary = $this->resolveMysqlBinary('mysql');
        $sql = File::get($sqlPath);

        $command = [
            $binary,
            '--host='.(string) ($connection['host'] ?? '127.0.0.1'),
            '--port='.(string) ($connection['port'] ?? '3306'),
            '--user='.(string) ($connection['username'] ?? 'root'),
            (string) ($connection['database'] ?? ''),
        ];

        $result = $this->runMysqlProcess($command, $connection, $sql);
        if (! $result->successful()) {
            throw new RuntimeException(trim($result->errorOutput()) ?: 'mysql client failed to restore the database backup.');
        }
    }

    private function restoreMysqlViaPhp(string $sqlPath): void
    {
        $sql = File::get($sqlPath);
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($this->splitSqlStatements($sql) as $statement) {
            if ($statement === '') {
                continue;
            }

            DB::unprepared($statement);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * @return list<string>
     */
    private function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $buffer = '';

        foreach (preg_split('/\R/', $sql) ?: [] as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '--')) {
                continue;
            }

            $buffer .= $line."\n";

            if (str_ends_with(rtrim($line), ';')) {
                $statements[] = trim($buffer);
                $buffer = '';
            }
        }

        if (trim($buffer) !== '') {
            $statements[] = trim($buffer);
        }

        return $statements;
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function runMysqlProcess(array $command, array $connection, ?string $input = null): \Illuminate\Process\ProcessResult
    {
        $password = (string) ($connection['password'] ?? '');
        $process = Process::timeout(600);

        if ($password !== '') {
            $process = $process->env([
                'MYSQL_PWD' => $password,
            ]);
        }

        if ($input !== null) {
            return $process->input($input)->run($command);
        }

        return $process->run($command);
    }

    /**
     * @return array<string, mixed>
     */
    private function mysqlConnectionConfig(): array
    {
        $connection = config('database.connections.'.$this->connectionName());
        if (! is_array($connection)) {
            throw new RuntimeException('Database connection configuration is missing.');
        }

        return $connection;
    }

    private function sqliteDatabasePath(): string
    {
        $database = config('database.connections.'.$this->connectionName().'.database');

        if (! is_string($database) || $database === '') {
            throw new RuntimeException('SQLite database path is not configured.');
        }

        return $database;
    }

    private function backupDirectory(): string
    {
        return storage_path('app/'.self::BACKUP_DIRECTORY);
    }

    private function ensureBackupDirectoryExists(): void
    {
        $directory = $this->backupDirectory();

        if (! is_dir($directory) && ! File::makeDirectory($directory, 0755, true)) {
            throw new RuntimeException("Unable to create backup directory [{$directory}].");
        }
    }

    private function buildFilename(string $extension): string
    {
        return sprintf(
            'hris-%s-%s.%s',
            $this->connectionName(),
            now()->format('Y-m-d-His'),
            $extension,
        );
    }

    private function resolveBackupPath(string $filename): string
    {
        if (! preg_match('/^hris-[a-z0-9_-]+-\d{4}-\d{2}-\d{2}-\d{6}\.(sql|sqlite|db)$/', $filename)) {
            throw new RuntimeException('Invalid backup filename.');
        }

        return $this->backupDirectory().'/'.$filename;
    }

    private function resolveMysqlBinary(string $binary): string
    {
        $candidates = array_filter([
            config('database.backup_mysql_binary_'.$binary),
            env(strtoupper($binary).'_PATH'),
            '/usr/bin/'.$binary,
            '/usr/local/bin/'.$binary,
        ]);

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && $candidate !== '' && is_executable($candidate)) {
                return $candidate;
            }
        }

        $result = Process::run(['which', $binary]);
        $path = trim($result->output());

        if ($result->successful() && $path !== '' && is_executable($path)) {
            return $path;
        }

        throw new RuntimeException("The [{$binary}] command was not found. Install MySQL client tools or set ".strtoupper($binary).'_PATH in .env.');
    }
}
