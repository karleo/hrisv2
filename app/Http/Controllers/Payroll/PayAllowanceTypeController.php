<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePayAllowanceTypeRequest;
use App\Http\Requests\Payroll\UpdatePayAllowanceTypeRequest;
use App\Models\PayAllowanceType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayAllowanceTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $allowanceTypes = PayAllowanceType::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('payroll/allowance-types/index', [
            'allowanceTypes' => $allowanceTypes,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('payroll/allowance-types/create');
    }

    public function store(StorePayAllowanceTypeRequest $request): RedirectResponse
    {
        PayAllowanceType::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->integer('sort_order', 0),
        ]);

        return to_route('payroll.allowance-types.index');
    }

    public function edit(PayAllowanceType $pay_allowance_type): Response
    {
        return Inertia::render('payroll/allowance-types/edit', [
            'allowanceType' => $pay_allowance_type,
        ]);
    }

    public function update(UpdatePayAllowanceTypeRequest $request, PayAllowanceType $pay_allowance_type): RedirectResponse
    {
        $pay_allowance_type->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', $pay_allowance_type->is_active),
            'sort_order' => $request->integer('sort_order', $pay_allowance_type->sort_order),
        ]);

        return to_route('payroll.allowance-types.index');
    }

    public function destroy(PayAllowanceType $pay_allowance_type): RedirectResponse
    {
        $pay_allowance_type->delete();

        return to_route('payroll.allowance-types.index');
    }
}
