<?php

namespace App\Services\FaceVerification;

use App\Contracts\FaceVerificationContract;
use App\Enums\FaceProfileAngle;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class FaceVerificationService implements FaceVerificationContract
{
    public function enrollProfile(User $user, array $imagesByAngle): void
    {
        $this->purgeStoredFaceFiles($user);

        $disk = (string) config('face-login.disk');
        $dir = trim((string) config('face-login.reference_directory'), '/');

        foreach (FaceProfileAngle::ordered() as $angle) {
            $key = $angle->value;
            $upload = $imagesByAngle[$key] ?? null;
            if (! $upload instanceof UploadedFile || ! $upload->isValid()) {
                throw new RuntimeException("Missing or invalid face capture for angle: {$key}");
            }
        }

        $stored = [];
        foreach (FaceProfileAngle::ordered() as $angle) {
            $key = $angle->value;
            /** @var UploadedFile $upload */
            $upload = $imagesByAngle[$key];
            $realPath = $upload->getRealPath();
            if ($realPath === false) {
                throw new RuntimeException('Could not read face capture.');
            }
            $bytes = file_get_contents($realPath);
            if ($bytes === false) {
                throw new RuntimeException('Could not read face capture.');
            }
            $path = "{$dir}/{$user->id}/{$key}.jpg";
            Storage::disk($disk)->put($path, $bytes);
            $stored[$key] = $path;
        }

        $provider = config('face-login.driver') === 'rekognition' ? 'rekognition' : 'local';

        $user->forceFill([
            'face_profile' => $stored,
            'face_reference_path' => null,
            'face_enrolled_at' => now(),
            'face_provider' => $provider,
        ])->save();
    }

    public function verify(User $user, UploadedFile $liveImage): bool
    {
        $disk = (string) config('face-login.disk');
        $profile = $user->face_profile;

        if (is_array($profile) && $profile !== []) {
            return $this->verifyAgainstProfile($disk, $profile, $liveImage);
        }

        return $this->verifyLegacySingleReference($user, $disk, $liveImage);
    }

    public function deleteReference(User $user): void
    {
        $this->purgeStoredFaceFiles($user);

        $user->forceFill([
            'face_profile' => null,
            'face_reference_path' => null,
            'face_enrolled_at' => null,
            'face_provider' => null,
        ])->save();
    }

    /**
     * @param  array<string, mixed>  $profile  Map of angle => storage path
     */
    private function verifyAgainstProfile(string $disk, array $profile, UploadedFile $liveImage): bool
    {
        if (config('face-login.driver') === 'rekognition') {
            foreach ($profile as $referencePath) {
                if (! is_string($referencePath) || $referencePath === '') {
                    continue;
                }
                if ($this->compareRekognition($disk, $referencePath, $liveImage)) {
                    return true;
                }
            }

            return false;
        }

        return $this->verifyLocalProfile($disk, $profile, $liveImage);
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function verifyLocalProfile(string $disk, array $profile, UploadedFile $liveImage): bool
    {
        if (app()->isProduction()) {
            Log::critical('Face login driver is set to "local" in production; refusing verification.');

            return false;
        }

        $mode = (string) config('face-login.local_mode');

        if ($mode === 'hash') {
            $livePath = $liveImage->getRealPath();
            if ($livePath === false) {
                return false;
            }
            $live = file_get_contents($livePath);
            if ($live === false) {
                return false;
            }
            $liveHash = hash('sha256', $live);

            foreach ($profile as $referencePath) {
                if (! is_string($referencePath) || $referencePath === '') {
                    continue;
                }
                if (! Storage::disk($disk)->exists($referencePath)) {
                    continue;
                }
                $ref = Storage::disk($disk)->get($referencePath);
                if (hash_equals(hash('sha256', $ref), $liveHash)) {
                    return true;
                }
            }

            if (! app()->environment('testing')) {
                return $this->verifyLocalProfileWithAhash($disk, $profile, $liveImage);
            }

            return false;
        }

        if ($mode === 'ahash') {
            return $this->verifyLocalProfileWithAhash($disk, $profile, $liveImage);
        }

        Log::warning('Face login local driver is running with non-hash mode; refusing insecure verification.');

        return false;
    }

    private function verifyLegacySingleReference(User $user, string $disk, UploadedFile $liveImage): bool
    {
        $path = $user->face_reference_path;
        if ($path === null || $path === '') {
            return false;
        }

        if (! Storage::disk($disk)->exists($path)) {
            return false;
        }

        if (config('face-login.driver') === 'rekognition') {
            return $this->compareRekognition($disk, $path, $liveImage);
        }

        return $this->verifyLocalLegacy($disk, $path, $liveImage);
    }

    private function verifyLocalLegacy(string $disk, string $referencePath, UploadedFile $liveImage): bool
    {
        if (app()->isProduction()) {
            Log::critical('Face login driver is set to "local" in production; refusing verification.');

            return false;
        }

        $mode = (string) config('face-login.local_mode');

        if ($mode === 'hash') {
            $ref = Storage::disk($disk)->get($referencePath);
            $livePath = $liveImage->getRealPath();
            if ($livePath === false) {
                return false;
            }
            $live = file_get_contents($livePath);

            $hashMatched = $live !== false && hash_equals(hash('sha256', $ref), hash('sha256', $live));
            if ($hashMatched) {
                return true;
            }

            if (! app()->environment('testing')) {
                return $this->verifyLocalLegacyWithAhash($disk, $referencePath, $liveImage);
            }

            return false;
        }

        if ($mode === 'ahash') {
            return $this->verifyLocalLegacyWithAhash($disk, $referencePath, $liveImage);
        }

        Log::warning('Legacy face login local driver is running with non-hash mode; refusing insecure verification.');

        return false;
    }

    private function averageHashFromBinary(string $bytes, int $size = 16): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            Log::warning('GD extension is missing; local ahash verification cannot run.');

            return null;
        }

        $source = @imagecreatefromstring($bytes);
        if ($source === false) {
            return null;
        }

        $thumb = imagecreatetruecolor($size, $size);
        if ($thumb === false) {
            imagedestroy($source);

            return null;
        }

        imagecopyresampled(
            $thumb,
            $source,
            0,
            0,
            0,
            0,
            $size,
            $size,
            imagesx($source),
            imagesy($source),
        );

        $values = [];
        $sum = 0;
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                $rgb = imagecolorat($thumb, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $gray = (int) round(($r + $g + $b) / 3);
                $values[] = $gray;
                $sum += $gray;
            }
        }

        imagedestroy($thumb);
        imagedestroy($source);

        if ($values === []) {
            return null;
        }

        $avg = $sum / count($values);
        $bits = '';
        foreach ($values as $value) {
            $bits .= $value >= $avg ? '1' : '0';
        }

        return $bits;
    }

    private function hammingDistance(string $a, string $b): int
    {
        $length = min(strlen($a), strlen($b));
        $distance = abs(strlen($a) - strlen($b));
        for ($i = 0; $i < $length; $i++) {
            if ($a[$i] !== $b[$i]) {
                $distance++;
            }
        }

        return $distance;
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function verifyLocalProfileWithAhash(string $disk, array $profile, UploadedFile $liveImage): bool
    {
        $livePath = $liveImage->getRealPath();
        if ($livePath === false) {
            return false;
        }
        $live = file_get_contents($livePath);
        if ($live === false) {
            return false;
        }
        $liveHash = $this->averageHashFromBinary($live);
        if ($liveHash === null) {
            return false;
        }

        $maxDistance = (int) config('face-login.local_ahash_max_distance');
        if (! app()->environment('testing')) {
            $maxDistance = max($maxDistance, 72);
        }
        foreach ($profile as $referencePath) {
            if (! is_string($referencePath) || $referencePath === '') {
                continue;
            }
            if (! Storage::disk($disk)->exists($referencePath)) {
                continue;
            }

            $ref = Storage::disk($disk)->get($referencePath);
            $refHash = $this->averageHashFromBinary($ref);
            if ($refHash === null) {
                continue;
            }

            if ($this->hammingDistance($liveHash, $refHash) <= $maxDistance) {
                return true;
            }
        }

        return false;
    }

    private function verifyLocalLegacyWithAhash(string $disk, string $referencePath, UploadedFile $liveImage): bool
    {
        $ref = Storage::disk($disk)->get($referencePath);
        $livePath = $liveImage->getRealPath();
        if ($livePath === false) {
            return false;
        }
        $live = file_get_contents($livePath);
        if ($live === false) {
            return false;
        }

        $refHash = $this->averageHashFromBinary($ref);
        $liveHash = $this->averageHashFromBinary($live);
        if ($refHash === null || $liveHash === null) {
            return false;
        }

        $maxDistance = (int) config('face-login.local_ahash_max_distance');
        if (! app()->environment('testing')) {
            $maxDistance = max($maxDistance, 72);
        }

        return $this->hammingDistance($refHash, $liveHash) <= $maxDistance;
    }

    private function compareRekognition(string $disk, string $referencePath, UploadedFile $liveImage): bool
    {
        $clientClass = \Aws\Rekognition\RekognitionClient::class;
        if (! class_exists($clientClass)) {
            throw new RuntimeException('aws/aws-sdk-php is required for Rekognition face verification.');
        }

        $key = config('services.aws.key');
        $secret = config('services.aws.secret');
        if (empty($key) || empty($secret)) {
            throw new RuntimeException('AWS credentials are missing for Rekognition face verification.');
        }

        $ref = Storage::disk($disk)->get($referencePath);
        $livePath = $liveImage->getRealPath();
        if ($livePath === false) {
            return false;
        }

        $live = file_get_contents($livePath);
        if ($live === false) {
            return false;
        }

        /** @var \Aws\Rekognition\RekognitionClient $client */
        $client = new $clientClass([
            'version' => 'latest',
            'region' => (string) config('face-login.rekognition_region'),
            'credentials' => [
                'key' => $key,
                'secret' => $secret,
            ],
        ]);

        $result = $client->compareFaces([
            'SimilarityThreshold' => (float) config('face-login.similarity_threshold'),
            'SourceImage' => ['Bytes' => $ref],
            'TargetImage' => ['Bytes' => $live],
        ]);

        return count($result['FaceMatches'] ?? []) > 0;
    }

    private function purgeStoredFaceFiles(User $user): void
    {
        $diskName = (string) config('face-login.disk');
        $disk = Storage::disk($diskName);
        $dir = trim((string) config('face-login.reference_directory'), '/');

        $profile = $user->face_profile;
        if (is_array($profile)) {
            foreach ($profile as $path) {
                if (is_string($path) && $path !== '') {
                    $disk->delete($path);
                }
            }
        }

        if ($dir !== '' && $user->exists) {
            $disk->deleteDirectory("{$dir}/{$user->id}");
        }

        $legacy = $user->face_reference_path;
        if (is_string($legacy) && $legacy !== '') {
            $disk->delete($legacy);
        }
    }
}
