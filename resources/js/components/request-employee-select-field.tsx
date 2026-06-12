import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

export type RequestEmployeeOption = {
    id: number;
    first_name: string;
    last_name: string;
    department_id: number | null;
    job_position_id?: number | null;
};

type RequestEmployeeSelectFieldProps = {
    canChooseEmployee: boolean;
    employees: RequestEmployeeOption[];
    employeeId: number | '';
    onEmployeeChange: (
        employeeId: number | '',
        employee: RequestEmployeeOption | undefined,
    ) => void;
    error?: string;
    label?: string;
    id?: string;
    required?: boolean;
};

export function RequestEmployeeSelectField({
    canChooseEmployee,
    employees,
    employeeId,
    onEmployeeChange,
    error,
    label,
    id = 'employee_id',
    required = true,
}: RequestEmployeeSelectFieldProps) {
    const { t } = useI18n();
    const selectedEmployee = employees.find((employee) => employee.id === employeeId);
    const employeeLabel = label ?? t('forms.employee.label', 'Employee');

    if (!canChooseEmployee) {
        return (
            <div className="grid gap-2">
                <Label htmlFor={id}>{employeeLabel}</Label>
                <Input
                    id={id}
                    readOnly
                    value={
                        selectedEmployee
                            ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                            : '—'
                    }
                    className="bg-muted/40"
                />
                {employeeId !== '' ? (
                    <input type="hidden" name="employee_id" value={employeeId} />
                ) : null}
                <InputError message={error} />
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {employeeLabel}
                {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            <Select
                value={employeeId === '' ? undefined : String(employeeId)}
                onValueChange={(value) => {
                    const nextId = value ? Number(value) : '';
                    const employee = employees.find((item) => item.id === nextId);

                    onEmployeeChange(nextId, employee);
                }}
                required={required}
            >
                <SelectTrigger id={id} className="h-10 w-full">
                    <SelectValue
                        placeholder={t('forms.employee.selectEmployee', 'Select employee')}
                    />
                </SelectTrigger>
                <SelectContent>
                    {employees.map((employee) => (
                        <SelectItem key={employee.id} value={String(employee.id)}>
                            {employee.first_name} {employee.last_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}
