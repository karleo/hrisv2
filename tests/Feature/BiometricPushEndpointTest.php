<?php

namespace Tests\Feature;

use App\Models\BiometricSetting;
use App\Models\Employee;
use App\Models\EmployeeTimeEntry;
use App\Models\WorkTimetable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiometricPushEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_handshake_requires_enabled_settings_and_optional_key(): void
    {
        BiometricSetting::current()->update([
            'is_enabled' => true,
            'comm_key' => 'abcd1234',
        ]);

        $this->get('/iclock/getrequest')->assertForbidden();
        $this->get('/iclock/getrequest?key=wrong')->assertForbidden();
        $this->get('/iclock/getrequest?key=abcd1234')->assertOk()->assertSee('OK');
    }

    public function test_cdata_ingests_adms_lines_and_creates_time_entries(): void
    {
        BiometricSetting::current()->update([
            'is_enabled' => true,
            'timezone' => 'Asia/Manila',
            'employee_identifier_field' => 'employee_code',
            'comm_key' => null,
        ]);

        Employee::factory()->create([
            'employee_code' => 'EMP-1001',
            'work_timetable_id' => WorkTimetable::query()->firstOrFail()->id,
        ]);

        $payload = implode("\n", [
            'EMP-1001	2026-04-17 08:01:00	1	0	0',
            'EMP-1001	2026-04-17 17:30:00	1	0	0',
        ]);

        $this->post('/iclock/cdata?SN=SN-ICLOCK-01&table=ATTLOG', $payload, [
            'CONTENT_TYPE' => 'text/plain',
        ])->assertOk()->assertSee('OK');

        $entry = EmployeeTimeEntry::query()->first();
        $this->assertNotNull($entry);
        $this->assertNotNull($entry->clock_out_at);
    }

    public function test_cdata_deduplicates_replayed_push_rows(): void
    {
        BiometricSetting::current()->update([
            'is_enabled' => true,
            'timezone' => 'Asia/Manila',
            'employee_identifier_field' => 'employee_code',
        ]);

        Employee::factory()->create([
            'employee_code' => 'EMP-1002',
            'work_timetable_id' => WorkTimetable::query()->firstOrFail()->id,
        ]);

        $payload = 'EMP-1002	2026-04-17 08:15:00	1	0	0';

        $this->post('/iclock/cdata?SN=SN-ICLOCK-02', $payload)->assertOk();
        $this->post('/iclock/cdata?SN=SN-ICLOCK-02', $payload)->assertOk();

        $this->assertSame(1, EmployeeTimeEntry::query()->count());
    }
}
