<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\JobPosition;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Models\WorkTimetable;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create(['email_verified_at' => now()]));
    }

    public function test_index_displays_employees(): void
    {
        Employee::factory()->count(3)->create();

        $response = $this->get(route('employees.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/index')
            ->has('employees')
            ->has('employees.data', 3)
            ->where('stats.totalEmployees', 3)
            ->where('stats.activeEmployees', 0)
            ->where('stats.totalDepartments', Department::query()->count())
            ->where('stats.noLoginAccessEmployees', 3)
        );
    }

    public function test_index_returns_zero_stats_when_no_employees_exist(): void
    {
        $response = $this->get(route('employees.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/index')
            ->where('stats.totalEmployees', 0)
            ->where('stats.activeEmployees', 0)
            ->where('stats.totalDepartments', Department::query()->count())
            ->where('stats.noLoginAccessEmployees', 0)
        );
    }

    public function test_create_displays_form(): void
    {
        $response = $this->get(route('employees.create'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/create')
            ->has('departments')
            ->has('jobPositions')
            ->has('workTimetables')
        );
    }

    public function test_template_download_returns_csv(): void
    {
        $response = $this->get(route('employees.template.download'));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertHeader('content-disposition');
        $response->assertSee('employee_code,first_name,last_name,email_address', false);
    }

    public function test_export_download_returns_csv_with_employee_rows(): void
    {
        $department = Department::factory()->create(['code' => 'ENG', 'name' => 'Engineering']);
        $jobPosition = JobPosition::factory()->create(['code' => 'DEV', 'name' => 'Developer']);
        $timetable = WorkTimetable::factory()->create(['name' => 'General Shift']);
        Employee::factory()->create([
            'employee_code' => 'EMP-9001',
            'first_name' => 'Export',
            'last_name' => 'User',
            'email_address' => 'export.user@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        $response = $this->get(route('employees.export'));

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertSee('employee_code,first_name,last_name,email_address', false);
        $response->assertSee('EMP-9001,Export,User,export.user@example.com', false);
    }

    public function test_export_download_respects_active_filters(): void
    {
        $department = Department::factory()->create(['code' => 'OPS', 'name' => 'Operations']);
        $jobPosition = JobPosition::factory()->create(['code' => 'MKT', 'name' => 'Marketing Specialist']);
        $timetable = WorkTimetable::factory()->create(['name' => 'General Shift']);

        Employee::factory()->create([
            'employee_code' => 'EMP-9101',
            'first_name' => 'Target',
            'last_name' => 'Person',
            'email_address' => 'target.person@example.com',
            'employee_status' => 'On Probation',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        Employee::factory()->create([
            'employee_code' => 'EMP-9102',
            'first_name' => 'Other',
            'last_name' => 'Person',
            'email_address' => 'other.person@example.com',
            'employee_status' => 'Employed',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        $response = $this->get(route('employees.export', [
            'search' => 'Target',
            'employee_status' => 'On Probation',
        ]));

        $response->assertOk();
        $response->assertSee('EMP-9101,Target,Person,target.person@example.com', false);
        $response->assertDontSee('EMP-9102,Other,Person,other.person@example.com', false);
    }

    public function test_export_download_includes_group_column_when_grouped_by_department(): void
    {
        $engineering = Department::factory()->create(['code' => 'ENG', 'name' => 'Engineering']);
        $operations = Department::factory()->create(['code' => 'OPS', 'name' => 'Operations']);
        $jobPosition = JobPosition::factory()->create(['code' => 'DEV', 'name' => 'Developer']);
        $timetable = WorkTimetable::factory()->create(['name' => 'General Shift']);

        Employee::factory()->create([
            'employee_code' => 'EMP-9201',
            'first_name' => 'Alice',
            'last_name' => 'Eng',
            'email_address' => 'alice.eng@example.com',
            'department_id' => $engineering->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);
        Employee::factory()->create([
            'employee_code' => 'EMP-9202',
            'first_name' => 'Oscar',
            'last_name' => 'Ops',
            'email_address' => 'oscar.ops@example.com',
            'department_id' => $operations->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        $response = $this->get(route('employees.export', [
            'group_by' => 'department',
        ]));

        $response->assertOk();
        $response->assertSee('group,employee_code,first_name,last_name,email_address', false);
        $response->assertSee('Engineering,EMP-9201,Alice,Eng,alice.eng@example.com', false);
        $response->assertSee('Operations,EMP-9202,Oscar,Ops,oscar.ops@example.com', false);
    }

    public function test_store_creates_employee(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $timetable = WorkTimetable::factory()->create();

        $data = [
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email_address' => 'john.doe@example.com',
            'contact_number' => '+1 234 567 8900',
            'address_1' => '123 Main St',
            'address_2' => 'Apt 4',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
            'employee_status' => 'On Probation',
        ];

        $response = $this->post(route('employees.store'), $data);
        $response->assertSessionHasNoErrors();

        $employee = Employee::query()->where('employee_code', 'EMP-0001')->first();
        $this->assertNotNull($employee);
        $response->assertRedirect(route('employees.business-card', $employee));
        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email_address' => 'john.doe@example.com',
            'work_timetable_id' => $timetable->id,
            'role' => 'Employee',
            'employee_status' => 'On Probation',
        ]);
    }

    public function test_import_creates_employees_from_valid_csv_rows(): void
    {
        $department = Department::factory()->create(['code' => 'ENG']);
        $jobPosition = JobPosition::factory()->create(['code' => 'DEV']);
        $timetable = WorkTimetable::factory()->create(['name' => 'General Shift']);

        $csv = implode("\n", [
            'employee_code,first_name,last_name,email_address,contact_number,address_1,address_2,department_code,job_position_code,work_timetable_name,company_profile_name',
            'EMP-1001,Jane,Doe,jane.doe@example.com,+971500000001,Street 1,,ENG,DEV,General Shift,',
            'EMP-1002,Mark,Stone,mark.stone@example.com,+971500000002,Street 2,,ENG,DEV,General Shift,',
        ]);

        $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

        $response = $this->post(route('employees.import'), [
            'file' => $file,
        ]);

        $response->assertRedirect(route('employees.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-1001',
            'email_address' => 'jane.doe@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);
        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-1002',
            'email_address' => 'mark.stone@example.com',
        ]);
    }

    public function test_import_skips_invalid_rows_and_keeps_valid_ones(): void
    {
        Department::factory()->create(['code' => 'ENG']);
        JobPosition::factory()->create(['code' => 'DEV']);
        WorkTimetable::factory()->create(['name' => 'General Shift']);
        Employee::factory()->create([
            'employee_code' => 'EMP-EXIST',
            'email_address' => 'exists@example.com',
        ]);

        $csv = implode("\n", [
            'employee_code,first_name,last_name,email_address,contact_number,address_1,address_2,department_code,job_position_code,work_timetable_name,company_profile_name',
            'EMP-EXIST,Already,Used,exists@example.com,+971500000003,Street 3,,ENG,DEV,General Shift,',
            'EMP-1003,Valid,User,valid.user@example.com,+971500000004,Street 4,,ENG,DEV,General Shift,',
        ]);

        $file = UploadedFile::fake()->createWithContent('employees.csv', $csv);

        $response = $this->post(route('employees.import'), [
            'file' => $file,
        ]);

        $response->assertRedirect(route('employees.index'));
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('employees', [
            'employee_code' => 'EMP-1003',
            'email_address' => 'valid.user@example.com',
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->post(route('employees.store'), []);

        $response->assertSessionHasErrors([
            'employee_code',
            'first_name',
            'last_name',
            'email_address',
            'department_id',
            'job_position_id',
            'work_timetable_id',
        ]);
    }

    public function test_store_validates_unique_employee_code(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $timetable = WorkTimetable::factory()->create();
        Employee::factory()->create(['employee_code' => 'EMP-0001']);

        $response = $this->post(route('employees.store'), [
            'employee_code' => 'EMP-0001',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email_address' => 'jane.doe@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        $response->assertSessionHasErrors(['employee_code']);
    }

    public function test_store_validates_unique_email_address(): void
    {
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $timetable = WorkTimetable::factory()->create();
        Employee::factory()->create(['email_address' => 'same@example.com']);

        $response = $this->post(route('employees.store'), [
            'employee_code' => 'EMP-0002',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email_address' => 'same@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
        ]);

        $response->assertSessionHasErrors(['email_address']);
    }

    public function test_edit_displays_form(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->get(route('employees.edit', $employee));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/edit')
            ->has('employee')
            ->has('employee.documents')
            ->has('employee.work_timetable')
            ->has('departments')
            ->has('jobPositions')
            ->has('workTimetables')
            ->where('employee.id', $employee->id)
        );
    }

    public function test_edit_accepts_tab_query_string(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->get(route('employees.edit', $employee).'?tab=documents');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/edit')
            ->where('employee.id', $employee->id)
        );
    }

    public function test_edit_includes_leave_configuration_and_usage(): void
    {
        $employee = Employee::factory()->create([
            'leave_opening_balance' => 10,
        ]);

        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'days' => 3,
            'period_from' => '2026-04-01',
            'period_to' => '2026-04-03',
        ]);

        $response = $this->get(route('employees.edit', $employee));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/edit')
            ->where('leaveConfig.openingBalance', 10.0)
            ->where('leaveConfig.approvedDaysUsed', 3.0)
            ->where('leaveConfig.liveRemainingBalance', 7.0)
            ->where('leaveConfig.usage.0.leave_type', 'Annual Leave')
            ->where('leaveConfig.usage.0.leave_category', 'paid')
            ->where('leaveConfig.usage.0.status', 'approved')
        );
    }

    public function test_update_modifies_employee(): void
    {
        $employee = Employee::factory()->create([
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $timetable = WorkTimetable::factory()->create();

        $previousRole = $employee->role;

        $data = [
            'employee_code' => 'EMP-0002',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email_address' => 'jane.smith@example.com',
            'contact_number' => null,
            'address_1' => '456 Oak Ave',
            'address_2' => null,
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
            'employee_status' => 'Serving Notice Period',
        ];

        $response = $this->patch(route('employees.update', $employee), $data);

        $response->assertRedirect(route('employees.business-card', $employee));
        $this->assertDatabaseHas('employees', array_merge($data, [
            'id' => $employee->id,
            'role' => $previousRole,
        ]));
    }

    public function test_update_validates_unique_employee_code_excluding_current(): void
    {
        $employee = Employee::factory()->create(['employee_code' => 'EMP-0001']);
        Employee::factory()->create(['employee_code' => 'EMP-0002']);

        $response = $this->patch(route('employees.update', $employee), [
            'employee_code' => 'EMP-0002',
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'email_address' => $employee->email_address,
            'department_id' => $employee->department_id,
            'job_position_id' => $employee->job_position_id,
            'work_timetable_id' => $employee->work_timetable_id,
        ]);

        $response->assertSessionHasErrors(['employee_code']);
    }

    public function test_destroy_deletes_employee(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->delete(route('employees.destroy', $employee));

        $response->assertRedirect(route('employees.index'));
        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
    }

    public function test_store_creates_employee_with_photo_and_documents(): void
    {
        Storage::fake('public');
        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $timetable = WorkTimetable::factory()->create();
        $photo = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg');
        $doc1 = UploadedFile::fake()->create('contract.pdf', 100);
        $doc2 = UploadedFile::fake()->create('id.pdf', 200);

        $response = $this->post(route('employees.store'), [
            'employee_code' => 'EMP-0001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email_address' => 'john.doe@example.com',
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
            'work_timetable_id' => $timetable->id,
            'photo' => $photo,
            'documents' => [$doc1, $doc2],
        ]);
        $response->assertSessionHasNoErrors();

        $employee = Employee::query()->where('employee_code', 'EMP-0001')->first();
        $this->assertNotNull($employee);
        $response->assertRedirect(route('employees.business-card', $employee));
        $this->assertNotNull($employee);
        $this->assertNotNull($employee->photo);
        $this->assertTrue(Storage::disk('public')->exists($employee->photo));
        $this->assertSame(2, $employee->documents()->count());
    }

    public function test_destroy_document_removes_document(): void
    {
        $employee = Employee::factory()->create();
        Storage::disk('public')->deleteDirectory("employees/{$employee->id}/documents");
        $path = UploadedFile::fake()
            ->create('test.pdf', 100, 'application/pdf')
            ->store("employees/{$employee->id}/documents", 'public');
        $document = $employee->documents()->create([
            'name' => 'test',
            'path' => $path,
            'original_name' => 'test.pdf',
        ]);

        $response = $this->delete(route('employees.documents.destroy', [$employee, $document]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('employee_documents', ['id' => $document->id]);
        Storage::disk('public')->deleteDirectory("employees/{$employee->id}/documents");
    }

    public function test_employees_require_authentication(): void
    {
        $this->post(route('logout'));

        $this->get(route('employees.index'))->assertRedirect();
        $this->get(route('employees.create'))->assertRedirect();
        $this->post(route('employees.store'), [])->assertRedirect();
    }

    public function test_business_card_includes_photo_and_logo_urls_as_relative_storage_paths(): void
    {
        Storage::fake('public');

        $department = Department::factory()->create();
        $jobPosition = JobPosition::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id,
            'job_position_id' => $jobPosition->id,
        ]);

        $photoPath = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg')
            ->store("employees/{$employee->id}", 'public');
        $logoPath = UploadedFile::fake()->create('logo.png', 120, 'image/png')
            ->store("employees/{$employee->id}", 'public');

        $employee->update([
            'photo' => $photoPath,
            'company_logo' => $logoPath,
        ]);

        $response = $this->get(route('employees.business-card', $employee));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/business-card')
            ->where('employee.id', $employee->id)
            ->where('employee.photo_url', '/storage/'.$photoPath)
            ->where('employee.company_logo_url', '/storage/'.$logoPath)
        );
    }

    public function test_my_profile_documents_use_relative_storage_urls(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = auth()->user();
        $this->assertInstanceOf(User::class, $user);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $path = UploadedFile::fake()
            ->create('profile-doc.csv', 64, 'text/csv')
            ->store("employees/{$employee->id}/documents", 'public');

        $employee->documents()->create([
            'name' => 'Profile Document',
            'path' => $path,
            'original_name' => 'profile-doc.csv',
        ]);

        $response = $this->get(route('my-profile.show'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/profile')
            ->where('employee.documents.0.url', '/storage/'.$path)
        );
    }

    public function test_my_profile_document_view_route_returns_inline_file(): void
    {
        Storage::fake('public');

        /** @var User $user */
        $user = auth()->user();
        $this->assertInstanceOf(User::class, $user);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
        ]);

        $path = "employees/{$employee->id}/documents/test.pdf";
        Storage::disk('public')->put($path, '%PDF-1.4 fake pdf content');

        $document = $employee->documents()->create([
            'name' => 'Test PDF',
            'path' => $path,
            'original_name' => 'shiplevel14710.pdf',
        ]);

        $response = $this->get(route('my-profile.documents.show', [
            'employee_document' => $document->id,
        ]));

        $response->assertOk();
        $contentDisposition = $response->headers->get('Content-Disposition', '');
        $this->assertStringContainsString('inline', $contentDisposition);
        $this->assertStringContainsString('shiplevel14710.pdf', $contentDisposition);
    }

    public function test_shared_auth_includes_avatar_url_when_employee_has_photo(): void
    {
        Storage::fake('public');
        $photoPath = 'employees/1/face.png';
        Storage::disk('public')->put($photoPath, 'fake-image');

        /** @var User $user */
        $user = auth()->user();
        $this->assertInstanceOf(User::class, $user);

        Employee::factory()->create([
            'user_id' => $user->id,
            'photo' => $photoPath,
        ]);

        $response = $this->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.avatar', '/storage/'.$photoPath)
        );
    }

    public function test_admin_without_employee_can_open_my_profile(): void
    {
        /** @var User $user */
        $user = auth()->user();
        $this->assertInstanceOf(User::class, $user);

        $response = $this->get(route('my-profile.show'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/profile')
            ->where('employee', null)
            ->where('hasEmployeeProfile', false)
            ->has('emailSignaturePreview')
            ->where('emailSignaturePreview.fullName', $user->name)
        );
    }

    public function test_my_profile_includes_leave_policy_summary_and_usage(): void
    {
        /** @var User $user */
        $user = auth()->user();
        $this->assertInstanceOf(User::class, $user);

        $employee = Employee::factory()->create([
            'user_id' => $user->id,
            'leave_opening_balance' => 10,
        ]);

        LeaveType::factory()->create([
            'name' => 'Annual Leave',
            'leave_category' => 'paid',
        ]);
        LeaveType::factory()->create([
            'name' => 'Unpaid Leave',
            'leave_category' => 'unpaid',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'absence_types' => ['Annual Leave'],
            'status' => 'approved',
            'days' => 2,
            'period_from' => '2026-04-10',
            'period_to' => '2026-04-11',
        ]);

        LeaveRequest::factory()->create([
            'employee_id' => $employee->id,
            'department_id' => $employee->department_id,
            'absence_types' => ['Unpaid Leave'],
            'status' => 'approved',
            'days' => 3,
            'period_from' => '2026-04-12',
            'period_to' => '2026-04-14',
        ]);

        $response = $this->get(route('my-profile.show'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('employees/profile')
            ->where('leaveConfig.openingBalance', 10.0)
            ->where('leaveConfig.approvedDaysUsed', 2.0)
            ->where('leaveConfig.liveRemainingBalance', 8.0)
            ->where('leaveConfig.usage.0.leave_type', 'Unpaid Leave')
            ->where('leaveConfig.usage.0.leave_category', 'unpaid')
        );
    }
}
