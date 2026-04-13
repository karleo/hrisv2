<?php

namespace App\Contracts;

use App\Models\User;
use Illuminate\Http\UploadedFile;

interface FaceVerificationContract
{
    /**
     * Persist three reference images (front, left, right) and mark enrollment metadata.
     *
     * @param  array<string, UploadedFile>  $imagesByAngle  Keys must be {@see \App\Enums\FaceProfileAngle} values.
     */
    public function enrollProfile(User $user, array $imagesByAngle): void;

    /**
     * Compare a live capture to the user's stored profile (multi-angle) or legacy single reference.
     */
    public function verify(User $user, UploadedFile $liveImage): bool;

    /**
     * Remove stored reference data for the user (disk + model fields).
     */
    public function deleteReference(User $user): void;
}
