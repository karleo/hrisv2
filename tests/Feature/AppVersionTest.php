<?php

namespace Tests\Feature;

use App\Models\AppVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_seeds_initial_version(): void
    {
        $this->assertDatabaseHas('app_versions', [
            'version' => '1.12',
        ]);
    }

    public function test_current_returns_latest_released_version(): void
    {
        AppVersion::query()->create([
            'version' => '1.11',
            'description' => 'Previous release.',
            'released_at' => now()->subDay(),
        ]);

        AppVersion::query()->create([
            'version' => '1.13',
            'description' => 'Newest release.',
            'released_at' => now(),
        ]);

        $this->assertSame('1.13', AppVersion::current()?->version);
        $this->assertSame('1.13', AppVersion::currentVersion());
    }

    public function test_authenticated_pages_share_app_version(): void
    {
        $user = User::factory()->create();

        AppVersion::query()->where('version', '1.12')->delete();

        AppVersion::query()->create([
            'version' => '2.0',
            'description' => 'Major update with new features.',
            'released_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('appVersion', '2.0'));
    }
}
