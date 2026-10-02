<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class FundUsageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('officer', 'admin') ?? false;
    }

    public function rules(): array
    {
        $isUpdate = in_array($this->method(), ['PUT', 'PATCH'], true);

        return [
            'purpose' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:3000'],
            'category' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:120'],
            'amount' => [$isUpdate ? 'sometimes' : 'required', 'numeric', 'gt:0', 'max:99999999.99'],
            'approved_budget' => ['nullable', 'numeric', 'gte:0', 'max:99999999.99'],
            'date' => [$isUpdate ? 'sometimes' : 'required', 'date'],
            'approval_reference' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:150'],
            'committee' => ['nullable', 'string', 'max:180'],
            'beneficiaries' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'approved', 'published', 'archived'])],
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
