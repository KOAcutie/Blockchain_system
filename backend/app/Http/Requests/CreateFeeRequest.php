<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class CreateFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('officer', 'admin') ?? false;
    }

    public function rules(): array
    {
        $isUpdate = in_array($this->method(), ['PUT', 'PATCH'], true);

        return [
            'code' => ['nullable', 'string', 'max:50'],
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'purpose' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:120'],
            'semester' => ['nullable', 'string', 'max:80'],
            'academic_year' => ['nullable', 'string', 'max:80'],
            'resolution_no' => ['nullable', 'string', 'max:120'],
            'allocated_departments' => ['nullable', 'array'],
            'allocated_departments.*' => ['string', 'max:255'],
            'amount' => [$isUpdate ? 'sometimes' : 'required', 'numeric', 'gt:0', 'max:9999999.99'],
            'due_date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'active', 'closed', 'archived'])],
            'assign_to_all_students' => ['nullable', 'boolean'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}
