<?php

namespace Tests\Unit;

use App\Models\Employee;
use App\Support\EmployeePhotoUrl;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EmployeePhotoUrlTest extends TestCase
{
    #[Test]
    public function it_returns_null_without_employee_or_photo(): void
    {
        $this->assertNull(EmployeePhotoUrl::forPublicDisk(null));

        $employee = new Employee;
        $employee->photo = null;
        $this->assertNull(EmployeePhotoUrl::forPublicDisk($employee));

        $employee->photo = '';
        $this->assertNull(EmployeePhotoUrl::forPublicDisk($employee));
    }

    #[Test]
    public function it_normalizes_public_disk_photo_path(): void
    {
        $employee = new Employee(['photo' => 'employees\\1\\pic.jpg']);

        $this->assertSame('/storage/employees/1/pic.jpg', EmployeePhotoUrl::forPublicDisk($employee));
    }
}
