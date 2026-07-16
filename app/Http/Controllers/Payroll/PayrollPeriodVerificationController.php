<?php

namespace App\Http\Controllers\Payroll;

use App\Exceptions\PayrollWorkflowException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\DestroyPeriodVerificationRequest;
use App\Http\Requests\Payroll\ReopenPeriodRequest;
use App\Http\Requests\Payroll\StorePeriodVerificationRequest;
use App\Http\Requests\Payroll\VerifyAttendanceRequest;
use App\Http\Requests\Payroll\VerifyOvertimeRequest;
use App\Models\PayrollPeriodVerification;
use App\Services\Payroll\PayrollPeriodVerificationService;
use App\Support\CompanyAccessScope;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PayrollPeriodVerificationController extends Controller
{
    public function __construct(
        private readonly CompanyAccessScope $companyScope,
    ) {}

    public function index(): InertiaResponse
    {
        $periods = PayrollPeriodVerification::query()
            ->with(['hrVerifier:id,name', 'financeVerifier:id,name'])
            ->orderByDesc('period_from')
            ->get()
            ->map(fn (PayrollPeriodVerification $v) => [
                'id' => $v->id,
                'period_from' => $v->period_from,
                'period_to' => $v->period_to,
                'status' => $v->status,
                'hr_verifier_name' => $v->hrVerifier?->name,
                'hr_verified_at' => $v->hr_verified_at?->toDateTimeString(),
                'finance_verifier_name' => $v->financeVerifier?->name,
                'finance_verified_at' => $v->finance_verified_at?->toDateTimeString(),
            ]);

        return Inertia::render('payroll/period-verification/index', [
            'periods' => $periods,
        ]);
    }

    public function store(StorePeriodVerificationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        PayrollPeriodVerification::query()->firstOrCreate(
            [
                'company_profile_id' => null,
                'period_from' => $validated['period_from'],
                'period_to' => $validated['period_to'],
            ],
            ['status' => PayrollPeriodVerification::STATUS_PENDING_HR],
        );

        return redirect()->route('payroll.period-verifications.index')
            ->with('success', 'Pay period created and is pending HR attendance verification.');
    }

    public function show(PayrollPeriodVerification $periodVerification, PayrollPeriodVerificationService $service): InertiaResponse
    {
        $summary = $service->buildSummary(
            $periodVerification->period_from,
            $periodVerification->period_to,
        );

        return Inertia::render('payroll/period-verification/show', [
            'period' => [
                'id' => $periodVerification->id,
                'period_from' => $periodVerification->period_from,
                'period_to' => $periodVerification->period_to,
                'status' => $periodVerification->status,
                'hr_verifier_name' => $periodVerification->hrVerifier?->name,
                'hr_verified_at' => $periodVerification->hr_verified_at?->toDateTimeString(),
                'hr_notes' => $periodVerification->hr_notes,
                'finance_verifier_name' => $periodVerification->financeVerifier?->name,
                'finance_verified_at' => $periodVerification->finance_verified_at?->toDateTimeString(),
                'finance_notes' => $periodVerification->finance_notes,
            ],
            'summary' => $summary,
            'payrollRunMeta' => $service->payrollRunMeta($periodVerification),
        ]);
    }

    public function verifyAttendance(
        VerifyAttendanceRequest $request,
        PayrollPeriodVerification $periodVerification,
        PayrollPeriodVerificationService $service,
    ): RedirectResponse {
        if (! $periodVerification->isPendingHr()) {
            return redirect()->back()->with('error', 'Attendance can only be verified when the period is pending HR review.');
        }

        $service->verifyAttendance(
            $periodVerification,
            $request->user(),
            $request->input('notes'),
        );

        return redirect()->route('payroll.period-verifications.show', $periodVerification)
            ->with('success', 'Attendance verified. The period is now pending Finance overtime verification.');
    }

    public function verifyOvertime(
        VerifyOvertimeRequest $request,
        PayrollPeriodVerification $periodVerification,
        PayrollPeriodVerificationService $service,
    ): RedirectResponse {
        if (! $periodVerification->isPendingFinance()) {
            return redirect()->back()->with('error', 'Overtime can only be verified after HR has verified attendance.');
        }

        $service->verifyOvertime(
            $periodVerification,
            $request->user(),
            $request->input('notes'),
        );

        return redirect()->route('payroll.period-verifications.show', $periodVerification)
            ->with('success', 'Overtime verified. This pay period is now ready for payroll processing.');
    }

    public function reopen(
        ReopenPeriodRequest $request,
        PayrollPeriodVerification $periodVerification,
        PayrollPeriodVerificationService $service,
    ): RedirectResponse {
        try {
            $service->reopen($periodVerification);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.period-verifications.show', $periodVerification)
                ->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.period-verifications.show', $periodVerification)
            ->with('success', 'Period reopened. Any non-paid payroll runs were cancelled. HR and Finance must re-verify.');
    }

    public function destroy(
        DestroyPeriodVerificationRequest $request,
        PayrollPeriodVerification $periodVerification,
        PayrollPeriodVerificationService $service,
    ): RedirectResponse {
        try {
            $service->destroy($periodVerification);
        } catch (PayrollWorkflowException $exception) {
            return redirect()->route('payroll.period-verifications.show', $periodVerification)
                ->with('error', $exception->getMessage());
        }

        return redirect()->route('payroll.period-verifications.index')
            ->with('success', 'Pay period cancelled. You can create a new one with the same dates if needed.');
    }
}
