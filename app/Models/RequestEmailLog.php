<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestEmailLog extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'request_type',
        'request_id',
        'notification_type',
        'recipient_email',
        'channel',
        'status',
        'reason',
        'error_message',
        'performed_at',
    ];

    protected function casts(): array
    {
        return [
            'request_id' => 'integer',
            'performed_at' => 'datetime',
        ];
    }
}
