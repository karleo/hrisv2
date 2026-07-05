<?php

namespace App\Http\Requests\EmployeeTimeEntry;

use App\Models\EmployeeTimeEntry;
use App\Support\AttendanceEntryAuthorization;
use Illuminate\Foundation\Http\FormRequest;

class DestroyEmployeeTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        /** @var EmployeeTimeEntry|null $entry */
        $entry = $this->route('employee_time_entry');

        if ($user === null || $entry === null) {
            return false;
        }

        return app(AttendanceEntryAuthorization::class)->canDelete($user);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
