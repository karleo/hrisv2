<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Face verification driver
    |--------------------------------------------------------------------------
    |
    | "rekognition" — AWS Rekognition CompareFaces (requires AWS credentials).
    | "local" — development/testing; see local_mode below.
    |
    */
    'driver' => env('FACE_LOGIN_DRIVER', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Local driver behaviour
    |--------------------------------------------------------------------------
    |
    | "insecure" — kept for backward compatibility only; verification now refuses it.
    | "hash" — SHA-256 equality of file bytes (for automated tests only).
    | "ahash" — perceptual average-hash similarity (development convenience).
    |
    */
    'local_mode' => env('FACE_LOGIN_LOCAL_MODE', 'ahash'),

    'local_ahash_max_distance' => (int) env('FACE_LOGIN_LOCAL_AHASH_MAX_DISTANCE', 34),

    /*
    |--------------------------------------------------------------------------
    | Storage
    |--------------------------------------------------------------------------
    */
    'disk' => env('FACE_LOGIN_DISK', 'local'),

    'reference_directory' => 'face-references',

    /*
    |--------------------------------------------------------------------------
    | AWS Rekognition
    |--------------------------------------------------------------------------
    */
    'similarity_threshold' => (float) env('FACE_LOGIN_SIMILARITY_THRESHOLD', 90.0),

    'rekognition_region' => env('AWS_DEFAULT_REGION', 'us-east-1'),

];
