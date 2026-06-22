<?php

namespace App\Http\Controllers\Payroll;

use App\Enums\PayDeductionBehavior;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePayDeductionTypeRequest;
use App\Http\Requests\Payroll\UpdatePayDeductionTypeRequest;
use App\Models\PayDeductionType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayDeductionTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $deductionTypes = PayDeductionType::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                        ->orWhere('behavior', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('payroll/deduction-types/index', [
            'deductionTypes' => $deductionTypes,
            'behaviorOptions' => collect(PayDeductionBehavior::cases())->map(fn (PayDeductionBehavior $behavior) => [
                'value' => $behavior->value,
                'label' => $behavior->label(),
            ])->all(),
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('payroll/deduction-types/create', [
            'behaviorOptions' => collect(PayDeductionBehavior::cases())->map(fn (PayDeductionBehavior $behavior) => [
                'value' => $behavior->value,
                'label' => $behavior->label(),
            ])->all(),
        ]);
    }

    public function store(StorePayDeductionTypeRequest $request): RedirectResponse
    {
        PayDeductionType::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 0),
        ]);

        return to_route('payroll.deduction-types.index');
    }

    public function edit(PayDeductionType $pay_deduction_type): Response
    {
        return Inertia::render('payroll/deduction-types/edit', [
            'deductionType' => $pay_deduction_type,
            'behaviorOptions' => collect(PayDeductionBehavior::cases())->map(fn (PayDeductionBehavior $behavior) => [
                'value' => $behavior->value,
                'label' => $behavior->label(),
            ])->all(),
        ]);
    }

    public function update(UpdatePayDeductionTypeRequest $request, PayDeductionType $pay_deduction_type): RedirectResponse
    {
        $pay_deduction_type->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $pay_deduction_type->is_active),
            'sort_order' => $request->integer('sort_order', $pay_deduction_type->sort_order),
        ]);

        return to_route('payroll.deduction-types.index');
    }

    public function destroy(PayDeductionType $pay_deduction_type): RedirectResponse
    {
        $pay_deduction_type->delete();

        return to_route('payroll.deduction-types.index');
    }
}
