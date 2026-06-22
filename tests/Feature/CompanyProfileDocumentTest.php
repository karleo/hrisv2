<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\CompanyProfileDocument;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyProfileDocumentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);
        $this->actingAs(User::factory()->create());
    }

    public function test_edit_includes_documents_and_document_types(): void
    {
        $companyProfile = CompanyProfile::factory()->create();
        $documentType = DocumentType::factory()->create(['is_active' => true]);
        CompanyProfileDocument::factory()->create([
            'company_profile_id' => $companyProfile->id,
            'document_type_id' => $documentType->id,
        ]);

        $response = $this->get(route('company-profiles.edit', $companyProfile));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('company-profiles/edit')
            ->has('documentTypes')
            ->has('companyProfile.documents', 1)
        );
    }

    public function test_update_uploads_company_profile_documents(): void
    {
        Storage::fake('public');

        $companyProfile = CompanyProfile::factory()->create();
        $documentType = DocumentType::factory()->create([
            'is_active' => true,
            'requires_expiry_date' => true,
        ]);

        $response = $this->patch(route('company-profiles.update', $companyProfile), [
            'company_name' => $companyProfile->company_name,
            'document_type_ids' => [(string) $documentType->id],
            'document_expiry_dates' => ['2030-12-31'],
            'documents' => [
                UploadedFile::fake()->create('license.pdf', 100, 'application/pdf'),
            ],
        ]);

        $response->assertRedirect(route('company-profiles.edit', $companyProfile));

        $document = CompanyProfileDocument::query()->first();
        $this->assertNotNull($document);
        $this->assertSame($companyProfile->id, $document->company_profile_id);
        $this->assertSame($documentType->id, $document->document_type_id);
        $this->assertSame(CompanyProfileDocument::STATUS_ACTIVE, $document->status);
        $this->assertSame('2030-12-31', $document->expiry_date?->toDateString());
        Storage::disk('public')->assertExists($document->path);
    }

    public function test_show_document_downloads_file(): void
    {
        Storage::fake('public');

        $companyProfile = CompanyProfile::factory()->create();
        $path = UploadedFile::fake()->create('trade-license.pdf', 100, 'application/pdf')
            ->store("company-profiles/{$companyProfile->id}/documents", 'public');
        $document = CompanyProfileDocument::factory()->create([
            'company_profile_id' => $companyProfile->id,
            'path' => $path,
            'original_name' => 'trade-license.pdf',
        ]);

        $response = $this->get(route('company-profiles.documents.show', [
            'company_profile' => $companyProfile,
            'company_profile_document' => $document,
        ]));

        $response->assertOk();
        $response->assertDownload('trade-license.pdf');
    }

    public function test_archive_document_marks_expired_document_as_archived(): void
    {
        $companyProfile = CompanyProfile::factory()->create();
        $document = CompanyProfileDocument::factory()->expired()->create([
            'company_profile_id' => $companyProfile->id,
        ]);

        $response = $this->post(route('company-profiles.documents.archive', [
            'company_profile' => $companyProfile,
            'company_profile_document' => $document,
        ]));

        $response->assertRedirect();
        $document->refresh();
        $this->assertSame(CompanyProfileDocument::STATUS_ARCHIVED, $document->status);
        $this->assertNotNull($document->archived_at);
    }

    public function test_archive_document_rejects_non_expired_document(): void
    {
        $companyProfile = CompanyProfile::factory()->create();
        $document = CompanyProfileDocument::factory()->create([
            'company_profile_id' => $companyProfile->id,
            'status' => CompanyProfileDocument::STATUS_ACTIVE,
        ]);

        $response = $this->post(route('company-profiles.documents.archive', [
            'company_profile' => $companyProfile,
            'company_profile_document' => $document,
        ]));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $document->refresh();
        $this->assertSame(CompanyProfileDocument::STATUS_ACTIVE, $document->status);
    }

    public function test_expire_command_marks_documents_as_expired(): void
    {
        $companyProfile = CompanyProfile::factory()->create();
        $document = CompanyProfileDocument::factory()->create([
            'company_profile_id' => $companyProfile->id,
            'expiry_date' => now()->subDay()->toDateString(),
            'status' => CompanyProfileDocument::STATUS_ACTIVE,
        ]);

        $this->artisan('company-profile-documents:expire')->assertSuccessful();

        $document->refresh();
        $this->assertSame(CompanyProfileDocument::STATUS_EXPIRED, $document->status);
    }

    public function test_destroy_document_deletes_record_and_file(): void
    {
        Storage::fake('public');

        $companyProfile = CompanyProfile::factory()->create();
        $path = UploadedFile::fake()->create('certificate.pdf', 100, 'application/pdf')
            ->store("company-profiles/{$companyProfile->id}/documents", 'public');
        $document = CompanyProfileDocument::factory()->create([
            'company_profile_id' => $companyProfile->id,
            'path' => $path,
        ]);

        $response = $this->delete(route('company-profiles.documents.destroy', [
            'company_profile' => $companyProfile,
            'company_profile_document' => $document,
        ]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('company_profile_documents', ['id' => $document->id]);
        Storage::disk('public')->assertMissing($path);
    }
}
