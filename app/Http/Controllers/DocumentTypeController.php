<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentType\StoreDocumentTypeRequest;
use App\Http\Requests\DocumentType\UpdateDocumentTypeRequest;
use App\Models\DocumentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $documentTypes = DocumentType::query()
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($q) => $q->where('code', 'like', '%'.$request->search.'%')
                        ->orWhere('name', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                )
            )
            ->orderBy('code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('document-types/index', [
            'documentTypes' => $documentTypes,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('document-types/create');
    }

    public function store(StoreDocumentTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['requires_expiry_date'] = (bool) ($data['requires_expiry_date'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        DocumentType::query()->create($data);

        return to_route('document-types.index');
    }

    public function edit(DocumentType $document_type): Response
    {
        return Inertia::render('document-types/edit', [
            'documentType' => $document_type,
        ]);
    }

    public function update(UpdateDocumentTypeRequest $request, DocumentType $document_type): RedirectResponse
    {
        $data = $request->validated();
        $data['requires_expiry_date'] = (bool) ($data['requires_expiry_date'] ?? false);
        $data['is_active'] = (bool) ($data['is_active'] ?? false);

        $document_type->update($data);

        return to_route('document-types.index');
    }

    public function destroy(DocumentType $document_type): RedirectResponse
    {
        $document_type->delete();

        return to_route('document-types.index');
    }
}
