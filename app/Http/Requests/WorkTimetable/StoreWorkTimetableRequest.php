<?php

namespace App\Http\Requests\WorkTimetable;

use App\Http\Requests\Concerns\ValidatesWorkTimetableDays;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreWorkTimetableRequest extends FormRequest
{
    use ValidatesWorkTimetableDays;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge($this->workTimetableDayRules(), [
            'name' => ['required', 'string', 'max:255'],
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $this->withWorkTimetableDaysValidator($validator);
    }
}
