<?php

namespace App\Enums;

enum PayDeductionBehavior: string
{
    case Standard = 'standard';
    case Loan = 'loan';
    case CashAdvance = 'cash_advance';

    public function label(): string
    {
        return match ($this) {
            self::Standard => 'Standard deduction',
            self::Loan => 'Loan repayment',
            self::CashAdvance => 'Cash advance recovery',
        };
    }

    public function requiresPrincipal(): bool
    {
        return $this !== self::Standard;
    }
}
