export type PresenceEmployee = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string | null;
    job_position: string | null;
    photo_url: string | null;
};

export type EmployeePresencePayload = {
    employee_ids: number[];
    employees: PresenceEmployee[];
};
