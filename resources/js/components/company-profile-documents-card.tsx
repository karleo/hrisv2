import { router } from '@inertiajs/react';
import { Archive, Download, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { randomUuid } from '@/lib/random-uuid';

type DocumentType = {
    id: number;
    code: string;
    name: string;
    requires_expiry_date: boolean;
};

type CompanyProfileDocument = {
    id: number;
    name: string;
    document_type_id?: number | null;
    document_type?: {
        id: number;
        code: string;
        name: string;
    } | null;
    original_name: string;
    url: string;
    expiry_date?: string | null;
    status?: 'active' | 'expired' | 'archived' | string | null;
    version_number?: number | null;
};

function formatDocumentDate(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return value;
    }

    const [, yyyy, mm, dd] = match;

    return `${dd}/${mm}/${yyyy}`;
}

function documentStatusLabel(status: string | null | undefined): string {
    switch (status) {
        case 'expired':
            return 'Expired';
        case 'archived':
            return 'Archived';
        default:
            return 'Active';
    }
}

function documentStatusClasses(status: string | null | undefined): string {
    switch (status) {
        case 'expired':
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300';
        case 'archived':
            return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300';
        default:
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
}

export function CompanyProfileDocumentsCard({
    companyProfileId,
    documents,
    documentTypes,
    errors,
}: {
    companyProfileId: number;
    documents: CompanyProfileDocument[];
    documentTypes: DocumentType[];
    errors: Record<string, string | undefined>;
}) {
    const [documentFiles, setDocumentFiles] = useState<Array<File | null>>([]);
    const [documentRows, setDocumentRows] = useState<
        Array<{ id: string; documentTypeId: string; expiryDate: string }>
    >([{ id: randomUuid(), documentTypeId: '', expiryDate: '' }]);

    const activeDocuments = documents.filter(
        (doc) => (doc.status ?? 'active') === 'active',
    );
    const expiredDocuments = documents.filter(
        (doc) => doc.status === 'expired',
    );
    const archivedDocuments = documents.filter(
        (doc) => doc.status === 'archived',
    );
    const historicalDocuments = [...expiredDocuments, ...archivedDocuments];

    const documentTypeRequiresExpiryById = Object.fromEntries(
        documentTypes.map((documentType) => [
            String(documentType.id),
            documentType.requires_expiry_date,
        ]),
    );

    function addDocumentRow(): void {
        setDocumentRows((previous) => [
            ...previous,
            { id: randomUuid(), documentTypeId: '', expiryDate: '' },
        ]);
        setDocumentFiles((previous) => [...previous, null]);
    }

    function removeDocumentRow(id: string): void {
        const index = documentRows.findIndex((row) => row.id === id);
        setDocumentRows((previous) =>
            previous.length <= 1
                ? [{ id: randomUuid(), documentTypeId: '', expiryDate: '' }]
                : previous.filter((row) => row.id !== id),
        );
        if (index !== -1) {
            setDocumentFiles((previous) => {
                const next = [...previous];
                next.splice(index, 1);
                return next.length > 0
                    ? next
                    : [null];
            });
        }
    }

    function setDocumentRowDocumentTypeId(id: string, value: string): void {
        setDocumentRows((previous) =>
            previous.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          documentTypeId: value,
                          expiryDate:
                              documentTypeRequiresExpiryById[value] === false
                                  ? ''
                                  : row.expiryDate,
                      }
                    : row,
            ),
        );
    }

    function setDocumentRowExpiryDate(id: string, value: string): void {
        setDocumentRows((previous) =>
            previous.map((row) =>
                row.id === id ? { ...row, expiryDate: value } : row,
            ),
        );
    }

    function setDocumentRowFile(id: string, file: File | null): void {
        const index = documentRows.findIndex((row) => row.id === id);
        if (index === -1) {
            return;
        }

        setDocumentFiles((previous) => {
            const next = [...previous];
            next[index] = file;
            return next;
        });
    }

    function deleteDocument(doc: CompanyProfileDocument): void {
        if (confirm(`Remove "${doc.original_name}"?`)) {
            router.delete(
                `/company-profiles/${companyProfileId}/documents/${doc.id}`,
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }
    }

    function archiveDocument(doc: CompanyProfileDocument): void {
        if (confirm(`Archive "${doc.original_name}"?`)) {
            router.post(
                `/company-profiles/${companyProfileId}/documents/${doc.id}/archive`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }
    }

    function getDocumentDownloadUrl(documentId: number): string {
        return `/company-profiles/${companyProfileId}/documents/${documentId}/view`;
    }

    return (
        <div className="grid gap-2 rounded-lg border border-border/80 bg-muted/20 p-4">
            <div>
                <Label className="text-base font-medium">Company Documents</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Upload multiple documents with type labels and expiry dates.
                    Expired documents can be archived. Max 10 MB each.
                </p>
            </div>

            {(documents.length > 0) && (
                <div className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">
                                Active Documents
                            </h4>
                            <span className="text-xs text-muted-foreground">
                                {activeDocuments.length} item
                                {activeDocuments.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {activeDocuments.length > 0 ? (
                            <>
                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_104px] gap-3 px-3 text-[11px] font-medium text-muted-foreground">
                                    <span>Document type</span>
                                    <span>Status</span>
                                    <span>File</span>
                                    <span>Expiry Date</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                {activeDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_104px] items-center gap-3 rounded-md border border-border/70 bg-background px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.document_type?.name ??
                                                    doc.name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${documentStatusClasses(doc.status)}`}
                                                >
                                                    {documentStatusLabel(
                                                        doc.status,
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Version{' '}
                                                    {doc.version_number ?? 1}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.original_name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {formatDocumentDate(
                                                    doc.expiry_date,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={getDocumentDownloadUrl(
                                                    doc.id,
                                                )}
                                                download={doc.original_name}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 shrink-0"
                                                    aria-label="Download document"
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 shrink-0 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    deleteDocument(doc)
                                                }
                                                aria-label="Remove document"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                                No active documents.
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">
                                Expired Documents
                            </h4>
                            <span className="text-xs text-muted-foreground">
                                {expiredDocuments.length} item
                                {expiredDocuments.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {expiredDocuments.length > 0 ? (
                            <>
                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_120px] gap-3 px-3 text-[11px] font-medium text-muted-foreground">
                                    <span>Document type</span>
                                    <span>Status</span>
                                    <span>File</span>
                                    <span>Expiry Date</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                {expiredDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_120px] items-center gap-3 rounded-md border border-amber-200/70 bg-amber-50/30 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.document_type?.name ??
                                                    doc.name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${documentStatusClasses(doc.status)}`}
                                            >
                                                {documentStatusLabel(doc.status)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.original_name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {formatDocumentDate(
                                                    doc.expiry_date,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={getDocumentDownloadUrl(
                                                    doc.id,
                                                )}
                                                download={doc.original_name}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 shrink-0"
                                                    aria-label="Download document"
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 shrink-0"
                                                onClick={() =>
                                                    archiveDocument(doc)
                                                }
                                                aria-label="Archive document"
                                            >
                                                <Archive className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                                No expired documents.
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">
                                Archived History
                            </h4>
                            <span className="text-xs text-muted-foreground">
                                {archivedDocuments.length} item
                                {archivedDocuments.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {archivedDocuments.length > 0 ? (
                            <>
                                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_72px] gap-3 px-3 text-[11px] font-medium text-muted-foreground">
                                    <span>Document type</span>
                                    <span>Status</span>
                                    <span>File</span>
                                    <span>Expiry Date</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                {archivedDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)_140px_72px] items-center gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.document_type?.name ??
                                                    doc.name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${documentStatusClasses(doc.status)}`}
                                            >
                                                {documentStatusLabel(doc.status)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {doc.original_name}
                                            </p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-foreground">
                                                {formatDocumentDate(
                                                    doc.expiry_date,
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={getDocumentDownloadUrl(
                                                    doc.id,
                                                )}
                                                download={doc.original_name}
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 shrink-0"
                                                    aria-label="Download document"
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                                No archived records yet.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={addDocumentRow}
            >
                <Plus className="mr-2 size-4" />
                Add document
            </Button>

            {documentRows.length > 0 && (
                <div className="space-y-3">
                    {documentRows.map((row, index) => (
                        <div
                            key={row.id}
                            className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
                        >
                            <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">
                                        Document type
                                    </Label>
                                    <select
                                        name="document_type_ids[]"
                                        value={row.documentTypeId}
                                        onChange={(event) =>
                                            setDocumentRowDocumentTypeId(
                                                row.id,
                                                event.target.value,
                                            )
                                        }
                                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            Select document type
                                        </option>
                                        {documentTypes.map((documentType) => (
                                            <option
                                                key={documentType.id}
                                                value={String(documentType.id)}
                                            >
                                                {documentType.code} -{' '}
                                                {documentType.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            errors[
                                                `document_type_ids.${index}`
                                            ]
                                        }
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">File</Label>
                                    <Input
                                        type="file"
                                        name="documents[]"
                                        onChange={(event) =>
                                            setDocumentRowFile(
                                                row.id,
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                        className="h-8 text-sm"
                                    />
                                    <InputError
                                        message={errors[`documents.${index}`]}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">
                                        Expiry Date
                                    </Label>
                                    <Input
                                        type="date"
                                        name="document_expiry_dates[]"
                                        value={row.expiryDate}
                                        onChange={(event) =>
                                            setDocumentRowExpiryDate(
                                                row.id,
                                                event.target.value,
                                            )
                                        }
                                        disabled={
                                            row.documentTypeId !== '' &&
                                            documentTypeRequiresExpiryById[
                                                row.documentTypeId
                                            ] === false
                                        }
                                        className="h-8 text-sm"
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `document_expiry_dates.${index}`
                                            ]
                                        }
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={() => removeDocumentRow(row.id)}
                                    aria-label="Remove upload row"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {documents.length === 0 && historicalDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                </p>
            ) : null}
        </div>
    );
}
