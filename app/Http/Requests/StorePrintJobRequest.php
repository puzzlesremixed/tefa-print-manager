<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrintJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_number' => ['required', 'string', 'max:50'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.file' => ['required', 'file', 'max:10240'], // 10MB max
            'items.*.color' => ['required', 'in:color,bnw'],
        ];
    }
}
