import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Building2, ChevronLeft, CircleDollarSign, PenLine, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    store as storeCompensation,
    update as updateCompensation,
} from '@/actions/App/Http/Controllers/Payroll/EmployeeCompensationController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ModulePermissionsMap } from '@/types/permissions';

type Employee = { id: number; name: string; employee_code: string | null };

type PayAllowanceTypeOption = { id: number; code: string; name: string; description: string | null };
type PayDeductionTypeOption = { id: number; code: string; name: string; description: string | null; behavior: string };

type AllowanceItem = { id?: number; pay_allowance_type_id: number | ''; name: string; amount: number };
type DeductionItem = {
    id?: number;
    pay_deduction_type_id: number | '';
    name: string;
    amount: number;
    principal_amount?: number;
    remaining_balance?: number;
    behavior?: string;
};

type PreviewItem = { name: string; amount: number };

type Compensation = {
    id: number;
    basic_salary: number;
    currency: string;
    pay_frequency: string;
    allowances: AllowanceItem[];
    deductions: DeductionItem[];
    overtime_rate_multiplier: number;
    overtime_rate_basis: string;
    overtime_standard_monthly_hours: number;
    overtime_rate_per_basis: number;
    bank_name: string | null;
    bank_account_number: string | null;
    iban: string | null;
    effective_from: string | null;
    notes: string | null;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
};

const OVERTIME_MULTIPLIER_OPTIONS = [
    { value: '1.00', label: '1.00× — Straight time' },
    { value: '1.25', label: '1.25× — Standard overtime (GCC)' },
    { value: '1.50', label: '1.50× — Time and a half' },
    { value: '1.75', label: '1.75× — Weekend / holiday' },
    { value: '2.00', label: '2.00× — Double time' },
];

const OVERTIME_BASIS_OPTIONS = [
    { value: 'per_hour', label: 'Per hour', minutes: 60 },
    { value: 'per_30_minutes', label: 'Per 30 minutes', minutes: 30 },
    { value: 'per_15_minutes', label: 'Per 15 minutes', minutes: 15 },
    { value: 'per_minute', label: 'Per minute', minutes: 1 },
];

function formatAmount(value: number, currency: string): string {
    return `${currency} ${value.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function basisLabel(basis: string): string {
    return OVERTIME_BASIS_OPTIONS.find((o) => o.value === basis)?.label ?? basis;
}

function basisMinutes(basis: string): number {
    return OVERTIME_BASIS_OPTIONS.find((o) => o.value === basis)?.minutes ?? 60;
}

function calcRatePerBasis(basic: number, standardHours: number, basis: string): number {
    const standardMinutes = Math.max(1, standardHours * 60);
    return (basic / standardMinutes) * basisMinutes(basis);
}

function requiresPrincipal(behavior?: string): boolean {
    return behavior === 'loan' || behavior === 'cash_advance';
}

function estimatedMonths(principal: number, installment: number): number {
    if (principal <= 0 || installment <= 0) {
        return 0;
    }

    return Math.ceil(principal / installment);
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="mb-4 flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
        </div>
    );
}

function LivePreview({
    basic,
    allowances,
    deductions,
    currency,
}: {
    basic: number;
    allowances: PreviewItem[];
    deductions: PreviewItem[];
    currency: string;
}) {
    const allowancesTotal = allowances.reduce((sum, item) => sum + (item.amount || 0), 0);
    const deductionsTotal = deductions.reduce((sum, item) => sum + (item.amount || 0), 0);
    const gross = basic + allowancesTotal;
    const net = Math.max(0, gross - deductionsTotal);

    return (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live calculation preview</p>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Basic salary</span>
                <span className="tabular-nums">{formatAmount(basic, currency)}</span>
            </div>
            {allowances.filter((a) => a.amount > 0).map((item, i) => (
                <div key={i} className="flex justify-between">
                    <span className="pl-3 text-muted-foreground">+ {item.name || 'Allowance'}</span>
                    <span className="tabular-nums">{formatAmount(item.amount, currency)}</span>
                </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-medium">
                <span>Gross salary</span>
                <span className="tabular-nums">{formatAmount(gross, currency)}</span>
            </div>
            {deductions.filter((d) => d.amount > 0).map((item, i) => (
                <div key={i} className="flex justify-between">
                    <span className="pl-3 text-destructive/80">− {item.name || 'Deduction'}</span>
                    <span className="tabular-nums text-destructive">{formatAmount(item.amount, currency)}</span>
                </div>
            ))}
            {deductionsTotal > 0 && (
                <div className="flex justify-between text-destructive">
                    <span className="font-medium">Total deductions</span>
                    <span className="tabular-nums font-medium">{formatAmount(deductionsTotal, currency)}</span>
                </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-emerald-700 dark:text-emerald-400">
                <span>Net salary</span>
                <span className="tabular-nums">{formatAmount(net, currency)}</span>
            </div>
        </div>
    );
}

function AllowancesEditor({
    items,
    allowanceTypes,
    onChange,
    errors,
}: {
    items: AllowanceItem[];
    allowanceTypes: PayAllowanceTypeOption[];
    onChange: (items: AllowanceItem[]) => void;
    errors: Record<string, string>;
}) {
    const addItem = () => onChange([...items, { pay_allowance_type_id: '', name: '', amount: 0 }]);
    const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

    const updateItem = (index: number, patch: Partial<AllowanceItem>) => {
        const next = [...items];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.length === 0 && <p className="text-sm text-muted-foreground">No allowances added yet.</p>}
            {items.map((item, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end">
                    <div className="grid flex-1 gap-1.5">
                        <Label htmlFor={`allowances_${index}_type`}>Allowance type</Label>
                        <select
                            id={`allowances_${index}_type`}
                            name={`allowances[${index}][pay_allowance_type_id]`}
                            value={item.pay_allowance_type_id}
                            onChange={(e) => {
                                const typeId = Number(e.target.value);
                                const type = allowanceTypes.find((t) => t.id === typeId);
                                updateItem(index, {
                                    pay_allowance_type_id: typeId,
                                    name: type?.name ?? '',
                                });
                            }}
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="">Select allowance type</option>
                            {allowanceTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                        {errors[`allowances.${index}.pay_allowance_type_id`] && (
                            <p className="text-sm text-destructive">{errors[`allowances.${index}.pay_allowance_type_id`]}</p>
                        )}
                    </div>
                    <div className="grid w-full gap-1.5 sm:w-40">
                        <Label htmlFor={`allowances_${index}_amount`}>Amount</Label>
                        <Input
                            id={`allowances_${index}_amount`}
                            name={`allowances[${index}][amount]`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.amount || ''}
                            onChange={(e) => updateItem(index, { amount: parseFloat(e.target.value) || 0 })}
                            required
                        />
                        {errors[`allowances.${index}.amount`] && (
                            <p className="text-sm text-destructive">{errors[`allowances.${index}.amount`]}</p>
                        )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)} aria-label="Remove allowance">
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem} disabled={allowanceTypes.length === 0}>
                <Plus className="size-4" />
                Add allowance type
            </Button>
            {allowanceTypes.length === 0 && (
                <p className="text-xs text-amber-600">No allowance types in master list. Add them under Settings → Masters → Allowance Types.</p>
            )}
        </div>
    );
}

function DeductionsEditor({
    items,
    deductionTypes,
    onChange,
    errors,
}: {
    items: DeductionItem[];
    deductionTypes: PayDeductionTypeOption[];
    onChange: (items: DeductionItem[]) => void;
    errors: Record<string, string>;
}) {
    const addItem = () => onChange([...items, { pay_deduction_type_id: '', name: '', amount: 0 }]);
    const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

    const updateItem = (index: number, patch: Partial<DeductionItem>) => {
        const next = [...items];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const usedBehaviors = new Set(
        items
            .map((item) => item.behavior)
            .filter((behavior): behavior is string => requiresPrincipal(behavior)),
    );

    return (
        <div className="space-y-3">
            {errors.deductions && <p className="text-sm text-destructive">{errors.deductions}</p>}
            {items.length === 0 && <p className="text-sm text-muted-foreground">No deductions added yet.</p>}
            {items.map((item, index) => {
                const showPrincipal = requiresPrincipal(item.behavior);
                const months = showPrincipal ? estimatedMonths(item.principal_amount ?? 0, item.amount) : 0;

                return (
                    <div key={index} className="space-y-3 rounded-lg border p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="grid flex-1 gap-1.5">
                                <Label htmlFor={`deductions_${index}_type`}>Deduction type</Label>
                                <select
                                    id={`deductions_${index}_type`}
                                    name={`deductions[${index}][pay_deduction_type_id]`}
                                    value={item.pay_deduction_type_id}
                                    onChange={(e) => {
                                        const typeId = Number(e.target.value);
                                        const type = deductionTypes.find((t) => t.id === typeId);
                                        updateItem(index, {
                                            pay_deduction_type_id: typeId,
                                            name: type?.name ?? '',
                                            behavior: type?.behavior,
                                            principal_amount: requiresPrincipal(type?.behavior) ? item.principal_amount ?? 0 : undefined,
                                            remaining_balance: requiresPrincipal(type?.behavior) ? item.remaining_balance ?? item.principal_amount ?? 0 : undefined,
                                        });
                                    }}
                                    required
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="">Select deduction type</option>
                                    {deductionTypes.map((type) => {
                                        const disabled =
                                            requiresPrincipal(type.behavior) &&
                                            usedBehaviors.has(type.behavior) &&
                                            item.behavior !== type.behavior;

                                        return (
                                            <option key={type.id} value={type.id} disabled={disabled}>
                                                {type.name}
                                                {disabled ? ' (already added)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors[`deductions.${index}.pay_deduction_type_id`] && (
                                    <p className="text-sm text-destructive">{errors[`deductions.${index}.pay_deduction_type_id`]}</p>
                                )}
                            </div>
                            <div className="grid w-full gap-1.5 sm:w-40">
                                <Label htmlFor={`deductions_${index}_amount`}>
                                    {showPrincipal ? 'Monthly recovery' : 'Amount'}
                                </Label>
                                <Input
                                    id={`deductions_${index}_amount`}
                                    name={`deductions[${index}][amount]`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.amount || ''}
                                    onChange={(e) => updateItem(index, { amount: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                                {errors[`deductions.${index}.amount`] && (
                                    <p className="text-sm text-destructive">{errors[`deductions.${index}.amount`]}</p>
                                )}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => removeItem(index)} aria-label="Remove deduction">
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                        {showPrincipal && (
                            <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`deductions_${index}_principal`}>
                                        {item.behavior === 'cash_advance' ? 'Advance amount' : 'Loan principal'}
                                    </Label>
                                    <Input
                                        id={`deductions_${index}_principal`}
                                        name={`deductions[${index}][principal_amount]`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.principal_amount ?? ''}
                                        onChange={(e) => {
                                            const principal = parseFloat(e.target.value) || 0;
                                            updateItem(index, {
                                                principal_amount: principal,
                                                remaining_balance: principal,
                                            });
                                        }}
                                        required
                                    />
                                    {errors[`deductions.${index}.principal_amount`] && (
                                        <p className="text-sm text-destructive">{errors[`deductions.${index}.principal_amount`]}</p>
                                    )}
                                </div>
                                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                                    {item.behavior === 'cash_advance' ? (
                                        <p>Cash advance will be recovered from salary over approximately {months || '—'} pay period(s).</p>
                                    ) : (
                                        <p>Loan will be repaid over approximately {months || '—'} month(s) at the current installment.</p>
                                    )}
                                    {(item.remaining_balance ?? 0) > 0 && (
                                        <p className="mt-1 font-medium text-foreground">
                                            Outstanding balance: {item.remaining_balance?.toLocaleString('en', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                                <input type="hidden" name={`deductions[${index}][remaining_balance]`} value={item.remaining_balance ?? item.principal_amount ?? 0} />
                            </div>
                        )}
                    </div>
                );
            })}
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem} disabled={deductionTypes.length === 0}>
                <Plus className="size-4" />
                Add deduction type
            </Button>
            {deductionTypes.length === 0 && (
                <p className="text-xs text-amber-600">No deduction types in master list. Add them under Settings → Masters → Deduction Types.</p>
            )}
        </div>
    );
}

function CompensationForm({
    employee,
    compensation,
    allowanceTypes,
    deductionTypes,
    onCancel,
}: {
    employee: Employee;
    compensation: Compensation | null;
    allowanceTypes: PayAllowanceTypeOption[];
    deductionTypes: PayDeductionTypeOption[];
    onCancel?: () => void;
}) {
    const isEdit = compensation !== null;
    const action = isEdit
        ? updateCompensation({ employee: employee.id, compensation: compensation.id })
        : storeCompensation(employee.id);

    const [currency, setCurrency] = useState(compensation?.currency ?? 'AED');
    const [basic, setBasic] = useState(compensation?.basic_salary ?? 0);
    const [allowances, setAllowances] = useState<AllowanceItem[]>(
        compensation?.allowances?.length ? compensation.allowances : [],
    );
    const [deductions, setDeductions] = useState<DeductionItem[]>(
        compensation?.deductions?.length ? compensation.deductions : [],
    );
    const [overtimeBasis, setOvertimeBasis] = useState(compensation?.overtime_rate_basis ?? 'per_hour');
    const [standardHours, setStandardHours] = useState(compensation?.overtime_standard_monthly_hours ?? 176);
    const [multiplier, setMultiplier] = useState(compensation?.overtime_rate_multiplier ?? 1.25);

    const ratePerBasis = useMemo(
        () => calcRatePerBasis(basic, standardHours, overtimeBasis) * multiplier,
        [basic, standardHours, overtimeBasis, multiplier],
    );

    const num = (v: string) => parseFloat(v) || 0;

    return (
        <Form action={action} method={isEdit ? 'put' : 'post'}>
            {({ errors, processing }) => (
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-5">
                            <SectionHeader icon={CircleDollarSign} title="Base salary" description="Fixed monthly salary before allowances." />
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="basic_salary">Basic salary <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="basic_salary"
                                        name="basic_salary"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={compensation?.basic_salary ?? ''}
                                        onChange={(e) => setBasic(num(e.target.value))}
                                        required
                                    />
                                    {errors.basic_salary && <p className="text-sm text-destructive">{errors.basic_salary}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="currency">Currency <span className="text-destructive">*</span></Label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        defaultValue={compensation?.currency ?? 'AED'}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="AED">AED — UAE Dirham</option>
                                        <option value="SAR">SAR — Saudi Riyal</option>
                                        <option value="USD">USD — US Dollar</option>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="GBP">GBP — British Pound</option>
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="pay_frequency">Pay frequency <span className="text-destructive">*</span></Label>
                                    <select
                                        id="pay_frequency"
                                        name="pay_frequency"
                                        defaultValue={compensation?.pay_frequency ?? 'monthly'}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <SectionHeader icon={TrendingUp} title="Allowances" description="Select allowance types from the master list and set amounts." />
                            <AllowancesEditor items={allowances} allowanceTypes={allowanceTypes} onChange={setAllowances} errors={errors} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <SectionHeader icon={TrendingDown} title="Deductions" description="Select deduction types. Loan and cash advance require principal and monthly recovery." />
                            <DeductionsEditor items={deductions} deductionTypes={deductionTypes} onChange={setDeductions} errors={errors} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <SectionHeader
                                icon={CircleDollarSign}
                                title="Overtime configuration"
                                description="Set how overtime is calculated from attendance hours."
                            />
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="overtime_rate_basis">Rate basis</Label>
                                    <select
                                        id="overtime_rate_basis"
                                        name="overtime_rate_basis"
                                        value={overtimeBasis}
                                        onChange={(e) => setOvertimeBasis(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {OVERTIME_BASIS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="overtime_standard_monthly_hours">Standard monthly hours</Label>
                                    <Input
                                        id="overtime_standard_monthly_hours"
                                        name="overtime_standard_monthly_hours"
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        defaultValue={compensation?.overtime_standard_monthly_hours ?? 176}
                                        onChange={(e) => setStandardHours(num(e.target.value))}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="overtime_rate_multiplier">Multiplier</Label>
                                    <select
                                        id="overtime_rate_multiplier"
                                        name="overtime_rate_multiplier"
                                        value={String(multiplier)}
                                        onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {OVERTIME_MULTIPLIER_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>OT rate ({basisLabel(overtimeBasis)})</Label>
                                    <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium tabular-nums">
                                        {formatAmount(ratePerBasis, currency)}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Formula: (basic ÷ {standardHours}h) × {basisMinutes(overtimeBasis)}min × {multiplier}× per OT unit.
                                Example: 2h OT = {formatAmount(ratePerBasis * (120 / basisMinutes(overtimeBasis)), currency)}.
                            </p>
                        </CardContent>
                    </Card>

                    <LivePreview basic={basic} allowances={allowances} deductions={deductions} currency={currency} />

                    <Card>
                        <CardContent className="pt-5">
                            <SectionHeader icon={Building2} title="Bank / payment details" />
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="bank_name">Bank name</Label>
                                    <Input id="bank_name" name="bank_name" defaultValue={compensation?.bank_name ?? ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="bank_account_number">Account number</Label>
                                    <Input id="bank_account_number" name="bank_account_number" defaultValue={compensation?.bank_account_number ?? ''} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="iban">IBAN</Label>
                                    <Input id="iban" name="iban" className="font-mono" defaultValue={compensation?.iban ?? ''} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="effective_from">Effective from</Label>
                            <Input id="effective_from" name="effective_from" type="date" defaultValue={compensation?.effective_from ?? ''} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                defaultValue={compensation?.notes ?? ''}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Update compensation' : 'Save compensation'}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        )}
                    </div>
                </div>
            )}
        </Form>
    );
}

export default function CompensationShow({
    employee,
    compensation,
    allowanceTypes,
    deductionTypes,
}: {
    employee: Employee;
    compensation: Compensation | null;
    allowanceTypes: PayAllowanceTypeOption[];
    deductionTypes: PayDeductionTypeOption[];
}) {
    const { flash, modulePermissions } = usePage().props as {
        flash?: { success?: string; error?: string };
        modulePermissions?: ModulePermissionsMap;
    };

    const [isEditing, setIsEditing] = useState(false);
    const canCreate = modulePermissions?.payroll?.can_create ?? false;
    const canUpdate = modulePermissions?.payroll?.can_update ?? false;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll', href: '/payroll/period-verifications' },
        { title: 'Employee compensation', href: '/employees' },
        { title: employee.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Compensation — ${employee.name}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/employees">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ChevronLeft className="size-4" />
                            Employees
                        </Button>
                    </Link>
                    <Heading
                        title={`Salary configuration: ${employee.name}`}
                        description={employee.employee_code ? `Employee code: ${employee.employee_code}` : undefined}
                    />
                </div>

                {flash?.success && (
                    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {compensation && !isEditing ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="pt-5">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gross salary</p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums">{formatAmount(compensation.gross_salary, compensation.currency)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-5">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Deductions</p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">{formatAmount(compensation.total_deductions, compensation.currency)}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-300 dark:border-emerald-700">
                                <CardContent className="pt-5">
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net salary</p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatAmount(compensation.net_salary, compensation.currency)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Earnings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Basic salary</span>
                                        <span className="font-medium tabular-nums">{formatAmount(compensation.basic_salary, compensation.currency)}</span>
                                    </div>
                                    {compensation.allowances.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="text-muted-foreground">{item.name}</span>
                                            <span className="font-medium tabular-nums">{formatAmount(item.amount, compensation.currency)}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Deductions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {compensation.deductions.length === 0 ? (
                                            <p className="text-muted-foreground">No deductions configured.</p>
                                        ) : (
                                            compensation.deductions.map((item, i) => (
                                                <div key={i} className="space-y-0.5">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{item.name}</span>
                                                        <span className="font-medium tabular-nums text-destructive">{formatAmount(item.amount, compensation.currency)}</span>
                                                    </div>
                                                    {requiresPrincipal(item.behavior) && (item.principal_amount ?? 0) > 0 && (
                                                        <p className="pl-2 text-xs text-muted-foreground">
                                                            {item.behavior === 'cash_advance' ? 'Advance' : 'Principal'}: {formatAmount(item.principal_amount ?? 0, compensation.currency)}
                                                            {(item.remaining_balance ?? 0) > 0 && (
                                                                <> · Balance: {formatAmount(item.remaining_balance ?? 0, compensation.currency)}</>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overtime</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Rate basis</span>
                                            <span className="font-medium">{basisLabel(compensation.overtime_rate_basis)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Standard hours</span>
                                            <span className="font-medium">{compensation.overtime_standard_monthly_hours}h / month</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Multiplier</span>
                                            <span className="font-medium">{compensation.overtime_rate_multiplier}×</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                            <span className="text-muted-foreground">Rate per unit</span>
                                            <span className="font-medium tabular-nums">{formatAmount(compensation.overtime_rate_per_basis * compensation.overtime_rate_multiplier, compensation.currency)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {canUpdate && (
                            <Button variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
                                <PenLine className="size-4" />
                                Edit compensation
                            </Button>
                        )}
                    </div>
                ) : compensation && isEditing ? (
                    <CompensationForm
                        employee={employee}
                        compensation={compensation}
                        allowanceTypes={allowanceTypes}
                        deductionTypes={deductionTypes}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : canCreate ? (
                    <div className="space-y-4">
                        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            No compensation record exists. Add allowance types, deduction types, and overtime settings below.
                        </div>
                        <CompensationForm
                            employee={employee}
                            compensation={null}
                            allowanceTypes={allowanceTypes}
                            deductionTypes={deductionTypes}
                        />
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No compensation record has been set up for this employee yet.
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
