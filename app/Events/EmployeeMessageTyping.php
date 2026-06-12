<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmployeeMessageTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $employee
     */
    public function __construct(
        public int $conversationId,
        public int $recipientEmployeeId,
        public array $employee,
        public bool $isTyping,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("employee.{$this->recipientEmployeeId}");
    }

    public function broadcastAs(): string
    {
        return 'employee.message.typing';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'employee' => $this->employee,
            'is_typing' => $this->isTyping,
        ];
    }
}
