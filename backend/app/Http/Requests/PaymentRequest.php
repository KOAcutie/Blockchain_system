<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'fee_id' => ['required', 'integer', 'exists:fees,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['required', 'string', Rule::in(['ewallet', 'bank_transfer', 'cash', 'other'])],
            'reference_number' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'proof' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'mimetypes:image/jpeg,image/png,application/pdf',
                'max:5120', // 5 MB max
            ],
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
