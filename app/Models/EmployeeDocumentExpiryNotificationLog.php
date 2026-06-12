<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeDocumentExpiryNotificationLog extends Model
{
    public const STAGE_REMINDER_DAILY = 'reminder_daily';

    public const STAGE_EXPIRED_FINAL = 'expired_final';

    protected $fillable = [
        'employee_document_id',
        'user_id',
        'notified_on',
        'notification_stage',
    ];

    protected function casts(): array
    {
        return [
            'notified_on' => 'date:Y-m-d',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(EmployeeDocument::class, 'employee_document_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
