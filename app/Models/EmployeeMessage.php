<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $sender_employee_id
 * @property int $recipient_employee_id
 * @property string|null $attachment_path
 * @property string|null $attachment_original_name
 * @property \Illuminate\Support\Carbon|null $read_at
 * @property \Illuminate\Support\Carbon $created_at
 */
class EmployeeMessage extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeeMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_employee_id',
        'recipient_employee_id',
        'body',
        'read_at',
        'attachment_path',
        'attachment_original_name',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(EmployeeConversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'sender_employee_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'recipient_employee_id');
    }
}
