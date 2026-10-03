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

    protected function prepareForValidation(): void
    {
        if ($this->has('fee_id')) {
            $input = $this->input('fee_id');
            $fee = \App\Models\Fee::where('id', is_numeric($input) ? (int) $input : 0)
                ->orWhere('code', (string) $input)
                ->first();

            if (! $fee && is_numeric($input)) {
                $fee = \App\Models\Fee::where('status', 'active')
                    ->skip(max(0, ((int) $input) - 1))
                    ->first() ?? \App\Models\Fee::first();
            }

            if ($fee) {
                $this->merge(['fee_id' => $fee->id]);
            }
        }
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
