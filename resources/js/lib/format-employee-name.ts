export function employeeFullName(
    emp?: { first_name?: string | null; last_name?: string | null } | null,
): string | undefined {
    if (!emp) {
        return undefined;
    }
    const name = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();

    return name === '' ? undefined : name;
}
