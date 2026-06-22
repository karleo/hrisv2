import { Head, Link, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CompanyProfileController from '@/actions/App/Http/Controllers/CompanyProfileController';
import { CompanyProfileDocumentsCard } from '@/components/company-profile-documents-card';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import {
    applyBuilderStateToTemplate,
    buildDefaultSignatureTemplate,
    defaultBuilderStateFromCompanyProfile,
    isBuilderSignatureTemplate,
    parseBuilderStateFromTemplate,
    SIGNATURE_LOGO_LIBRARY,
    type SignatureBuilderState,
    type SignatureLogoId,
} from '@/lib/signature-template';
import { edit, index } from '@/routes/company-profiles';
import type { BreadcrumbItem } from '@/types';

type CountryOption = {
    id: number;
    code: string;
    name: string;
};

type DocumentTypeOption = {
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

type CompanyProfile = {
    id: number;
    logo: string | null;
    logo_url: string | null;
    business_card_logo: string | null;
    business_card_logo_url: string | null;
    business_card_back_logo_1_url: string | null;
    business_card_back_logo_2_url: string | null;
    business_card_back_logo_3_url: string | null;
    business_card_back_logo_4_url: string | null;
    company_name: string;
    company_address_1: string | null;
    company_address_2: string | null;
    country_id: number | null;
    website: string | null;
    signature_template: string | null;
    country: CountryOption | null;
    documents?: CompanyProfileDocument[];
};

const signatureTokens = [
    '{{full_name}}',
    '{{designation}}',
    '{{email}}',
    '{{mobile}}',
    '{{company_name}}',
    '{{company_address_1}}',
    '{{company_address_2}}',
    '{{website}}',
];

const businessCardBackLogoSlots = [1, 2, 3, 4] as const;

type BusinessCardBackLogoSlot = (typeof businessCardBackLogoSlots)[number];
type BackLogoPreviewState = Record<BusinessCardBackLogoSlot, string | null>;

type CompanyProfileTab =
    | 'company_information'
    | 'documents'
    | 'email_signature';

type SignatureAddressSource = 'company_address_1' | 'company_address_2';

function signatureAddressValue(
    source: SignatureAddressSource,
    companyAddress1: string,
    companyAddress2: string,
): string {
    return source === 'company_address_2' ? companyAddress2 : companyAddress1;
}

function backLogoPreviewsFromCompanyProfile(
    companyProfile: CompanyProfile,
): BackLogoPreviewState {
    return {
        1: companyProfile.business_card_back_logo_1_url,
        2: companyProfile.business_card_back_logo_2_url,
        3: companyProfile.business_card_back_logo_3_url,
        4: companyProfile.business_card_back_logo_4_url,
    };
}

export default function Edit({
    companyProfile,
    countries,
    documentTypes,
}: {
    companyProfile: CompanyProfile;
    countries: CountryOption[];
    documentTypes: DocumentTypeOption[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Company Profiles', href: index().url },
        {
            title: companyProfile.company_name,
            href: edit({ company_profile: companyProfile.id }).url,
        },
    ];

    const page = usePage();
    const queryString = page.url.includes('?')
        ? (page.url.split('?', 2)[1] ?? '')
        : '';
    const tabFromQuery = new URLSearchParams(queryString).get('tab');
    const initialTab: CompanyProfileTab =
        tabFromQuery === 'email_signature'
            ? 'email_signature'
            : tabFromQuery === 'documents'
              ? 'documents'
              : 'company_information';
    const [tab, setTab] = useState<CompanyProfileTab>(initialTab);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const businessCardLogoInputRef = useRef<HTMLInputElement>(null);
    const businessCardBackLogoInputRefs = useRef<
        Partial<Record<BusinessCardBackLogoSlot, HTMLInputElement | null>>
    >({});
    const advancedTemplateRef = useRef<HTMLTextAreaElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        companyProfile.logo_url,
    );
    const [businessCardLogoPreview, setBusinessCardLogoPreview] = useState<
        string | null
    >(companyProfile.business_card_logo_url);
    const [businessCardBackLogoPreviews, setBusinessCardBackLogoPreviews] =
        useState<BackLogoPreviewState>(
            backLogoPreviewsFromCompanyProfile(companyProfile),
        );
    const [companyAddress1, setCompanyAddress1] = useState(
        companyProfile.company_address_1 ?? '',
    );
    const [companyAddress2, setCompanyAddress2] = useState(
        companyProfile.company_address_2 ?? '',
    );
    const [companyWebsite, setCompanyWebsite] = useState(
        companyProfile.website ?? '',
    );
    const [signatureWebsiteEdited, setSignatureWebsiteEdited] = useState(false);

    const defaultStateFromCompany = useMemo(
        () =>
            defaultBuilderStateFromCompanyProfile({
                company_address_1: companyAddress1,
                company_address_2: companyAddress2,
                website: companyWebsite,
            }),
        [companyAddress1, companyAddress2, companyWebsite],
    );
    const parsedBuilderState =
        companyProfile.signature_template &&
        isBuilderSignatureTemplate(companyProfile.signature_template)
            ? parseBuilderStateFromTemplate(companyProfile.signature_template)
            : null;
    const initialSignatureAddressSource: SignatureAddressSource =
        parsedBuilderState?.addressLine.trim() === companyAddress2.trim() &&
        companyAddress2.trim() !== ''
            ? 'company_address_2'
            : 'company_address_1';
    const [signatureAddressSource, setSignatureAddressSource] =
        useState<SignatureAddressSource>(initialSignatureAddressSource);
    const [builderState, setBuilderState] = useState<SignatureBuilderState>(
        parsedBuilderState
            ? {
                  ...parsedBuilderState,
                  addressLine: signatureAddressValue(
                      initialSignatureAddressSource,
                      companyAddress1,
                      companyAddress2,
                  ),
                  website: defaultStateFromCompany.website,
              }
            : defaultStateFromCompany,
    );
    const hasNonBuilderTemplate =
        (companyProfile.signature_template?.trim() ?? '') !== '' &&
        !isBuilderSignatureTemplate(companyProfile.signature_template ?? '');
    const [useAdvancedTemplate, setUseAdvancedTemplate] = useState(
        hasNonBuilderTemplate,
    );
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(hasNonBuilderTemplate);
    const [advancedTemplate, setAdvancedTemplate] = useState(
        companyProfile.signature_template?.trim() ||
            buildDefaultSignatureTemplate(undefined, {
                company_address_1: companyProfile.company_address_1,
                company_address_2: companyProfile.company_address_2,
                website: companyProfile.website,
            }),
    );

    const generatedTemplate = useMemo(
        () => applyBuilderStateToTemplate(builderState),
        [builderState],
    );

    useEffect(() => {
        setBuilderState((previous) => ({
            ...previous,
            addressLine: signatureAddressValue(
                signatureAddressSource,
                companyAddress1,
                companyAddress2,
            ),
        }));
    }, [companyAddress1, companyAddress2, signatureAddressSource]);

    useEffect(() => {
        if (!signatureWebsiteEdited) {
            setBuilderState((previous) => ({
                ...previous,
                website: defaultStateFromCompany.website,
            }));
        }
    }, [defaultStateFromCompany.website, signatureWebsiteEdited]);
    const templateToSave = useAdvancedTemplate
        ? advancedTemplate
        : generatedTemplate;

    function insertIntoAdvancedTemplate(snippet: string): void {
        const textarea = advancedTemplateRef.current;
        if (!textarea) {
            setAdvancedTemplate((previous) => `${previous}\n${snippet}`);

            return;
        }

        const start = textarea.selectionStart ?? advancedTemplate.length;
        const end = textarea.selectionEnd ?? advancedTemplate.length;
        const before = advancedTemplate.slice(0, start);
        const after = advancedTemplate.slice(end);
        const nextValue = `${before}${snippet}${after}`;
        setAdvancedTemplate(nextValue);

        window.requestAnimationFrame(() => {
            const caret = start + snippet.length;
            textarea.focus();
            textarea.setSelectionRange(caret, caret);
        });
    }

    async function handleSignatureTemplatePaste(
        event: React.ClipboardEvent<HTMLTextAreaElement>,
    ): Promise<void> {
        const imageItem = Array.from(event.clipboardData.items).find((item) =>
            item.type.startsWith('image/'),
        );
        if (!imageItem) {
            return;
        }

        event.preventDefault();
        const imageFile = imageItem.getAsFile();
        if (!imageFile) {
            return;
        }

        if (imageFile.size > 1024 * 1024) {
            window.alert(
                'Pasted image is too large. Please use an image under 1 MB.',
            );

            return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () =>
                reject(new Error('Failed to read pasted image.'));
            reader.readAsDataURL(imageFile);
        });

        const alt = (imageFile.name || 'Pasted logo')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
        insertIntoAdvancedTemplate(
            `<img src="${dataUrl}" alt="${alt}" style="display:block; height:18px; width:auto; object-fit:contain;" />`,
        );
    }

    function toggleLogo(id: SignatureLogoId): void {
        setBuilderState((previous) => {
            const exists = previous.enabledLogoIds.includes(id);
            return {
                ...previous,
                enabledLogoIds: exists
                    ? previous.enabledLogoIds.filter((logoId) => logoId !== id)
                    : [...previous.enabledLogoIds, id],
            };
        });
    }

    function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoPreview(companyProfile.logo_url);
        }
    }

    function handleBusinessCardLogoChange(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0];
        if (file) {
            setBusinessCardLogoPreview(URL.createObjectURL(file));
        } else {
            setBusinessCardLogoPreview(companyProfile.business_card_logo_url);
        }
    }

    function handleBusinessCardBackLogoChange(
        slot: BusinessCardBackLogoSlot,
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = e.target.files?.[0];
        setBusinessCardBackLogoPreviews((previous) => ({
            ...previous,
            [slot]: file
                ? URL.createObjectURL(file)
                : backLogoPreviewsFromCompanyProfile(companyProfile)[slot],
        }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${companyProfile.company_name}`} />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Link
                    href={index()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back to Company Profiles
                </Link>

                <Heading
                    title="Edit Company Profile"
                    description="Update company profile details"
                />

                <div>
                    <Form
                        {...CompanyProfileController.update.form(
                            companyProfile.id,
                        )}
                        className="flex flex-col gap-6"
                        encType="multipart/form-data"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            tab === 'company_information'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            setTab('company_information')
                                        }
                                    >
                                        Company Information
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            tab === 'documents'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() => setTab('documents')}
                                    >
                                        Company Documents
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            tab === 'email_signature'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        onClick={() =>
                                            setTab('email_signature')
                                        }
                                    >
                                        Email Signature
                                    </Button>
                                </div>

                                <Card
                                    className={
                                        tab === 'company_information'
                                            ? ''
                                            : 'hidden'
                                    }
                                >
                                    <CardHeader>
                                        <CardTitle>
                                            Company Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-2">
                                            <Label>Logo</Label>
                                            <div className="flex flex-col items-start gap-4">
                                                <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                                                    {logoPreview ? (
                                                        <img
                                                            src={logoPreview}
                                                            alt="Logo"
                                                            className="size-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            <ImagePlus className="mx-auto size-8" />
                                                            <span className="mt-1 block text-xs">
                                                                No logo
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    ref={logoInputRef}
                                                    type="file"
                                                    name="logo"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={handleLogoChange}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        logoInputRef.current?.click()
                                                    }
                                                >
                                                    {logoPreview
                                                        ? 'Change logo'
                                                        : 'Upload logo'}
                                                </Button>
                                                <InputError
                                                    message={errors.logo}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>
                                                Business Card Front Logo
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                This logo appears on the front
                                                side of employee business cards.
                                            </p>
                                            <div className="flex flex-col items-start gap-4">
                                                <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                                                    {businessCardLogoPreview ? (
                                                        <img
                                                            src={
                                                                businessCardLogoPreview
                                                            }
                                                            alt="Business card logo"
                                                            className="size-full object-contain p-1"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            <ImagePlus className="mx-auto size-8" />
                                                            <span className="mt-1 block text-xs">
                                                                No logo
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    ref={
                                                        businessCardLogoInputRef
                                                    }
                                                    type="file"
                                                    name="business_card_logo"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={
                                                        handleBusinessCardLogoChange
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        businessCardLogoInputRef.current?.click()
                                                    }
                                                >
                                                    {businessCardLogoPreview
                                                        ? 'Change business card logo'
                                                        : 'Upload business card logo'}
                                                </Button>
                                                <InputError
                                                    message={
                                                        errors.business_card_logo
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                                            <div>
                                                <Label>
                                                    Business Card Back Logos
                                                </Label>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Upload up to four logos for
                                                    the back side of the
                                                    employee business card.
                                                </p>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                {businessCardBackLogoSlots.map(
                                                    (slot) => (
                                                        <div
                                                            key={slot}
                                                            className="flex flex-col items-start gap-3"
                                                        >
                                                            <p className="text-xs font-medium text-foreground">
                                                                Back Logo {slot}
                                                            </p>
                                                            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background/70">
                                                                {businessCardBackLogoPreviews[
                                                                    slot
                                                                ] ? (
                                                                    <img
                                                                        src={
                                                                            businessCardBackLogoPreviews[
                                                                                slot
                                                                            ] ??
                                                                            ''
                                                                        }
                                                                        alt={`Back logo ${slot}`}
                                                                        className="size-full object-contain p-1"
                                                                    />
                                                                ) : (
                                                                    <span className="text-muted-foreground">
                                                                        <ImagePlus className="mx-auto size-7" />
                                                                        <span className="mt-1 block text-xs">
                                                                            No
                                                                            logo
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <input
                                                                ref={(
                                                                    element,
                                                                ) => {
                                                                    businessCardBackLogoInputRefs.current[
                                                                        slot
                                                                    ] = element;
                                                                }}
                                                                type="file"
                                                                name={`business_card_back_logo_${slot}`}
                                                                accept="image/*"
                                                                className="sr-only"
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    handleBusinessCardBackLogoChange(
                                                                        slot,
                                                                        event,
                                                                    )
                                                                }
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    businessCardBackLogoInputRefs.current[
                                                                        slot
                                                                    ]?.click()
                                                                }
                                                            >
                                                                {businessCardBackLogoPreviews[
                                                                    slot
                                                                ]
                                                                    ? 'Change logo'
                                                                    : 'Upload logo'}
                                                            </Button>
                                                            <InputError
                                                                message={
                                                                    errors[
                                                                        `business_card_back_logo_${slot}`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="company_name">
                                                Company Name{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="company_name"
                                                name="company_name"
                                                required
                                                maxLength={255}
                                                defaultValue={
                                                    companyProfile.company_name
                                                }
                                            />
                                            <InputError
                                                message={errors.company_name}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="company_address_1">
                                                Company Address 1
                                            </Label>
                                            <Input
                                                id="company_address_1"
                                                name="company_address_1"
                                                maxLength={255}
                                                value={companyAddress1}
                                                onChange={(event) =>
                                                    setCompanyAddress1(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.company_address_1
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="company_address_2">
                                                Company Address 2
                                            </Label>
                                            <Input
                                                id="company_address_2"
                                                name="company_address_2"
                                                maxLength={255}
                                                value={companyAddress2}
                                                onChange={(event) =>
                                                    setCompanyAddress2(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.company_address_2
                                                }
                                            />
                                        </div>

                                        <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                                            <p className="text-sm font-medium text-foreground">
                                                Signature Address
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Choose which company address
                                                appears in the email signature.
                                            </p>
                                            <div className="mt-3 grid gap-2">
                                                <label className="flex items-start gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="signature_address_source"
                                                        value="company_address_1"
                                                        checked={
                                                            signatureAddressSource ===
                                                            'company_address_1'
                                                        }
                                                        onChange={() =>
                                                            setSignatureAddressSource(
                                                                'company_address_1',
                                                            )
                                                        }
                                                        className="mt-1"
                                                    />
                                                    <span>
                                                        <span className="block font-medium">
                                                            Use Company Address
                                                            1
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {companyAddress1 ||
                                                                'No address entered'}
                                                        </span>
                                                    </span>
                                                </label>
                                                <label className="flex items-start gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="signature_address_source"
                                                        value="company_address_2"
                                                        checked={
                                                            signatureAddressSource ===
                                                            'company_address_2'
                                                        }
                                                        onChange={() =>
                                                            setSignatureAddressSource(
                                                                'company_address_2',
                                                            )
                                                        }
                                                        className="mt-1"
                                                    />
                                                    <span>
                                                        <span className="block font-medium">
                                                            Use Company Address
                                                            2
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground">
                                                            {companyAddress2 ||
                                                                'No address entered'}
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="country_id">
                                                Country
                                            </Label>
                                            <select
                                                id="country_id"
                                                name="country_id"
                                                defaultValue={
                                                    companyProfile.country_id ??
                                                    ''
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]"
                                            >
                                                <option value="">
                                                    Select country
                                                </option>
                                                {countries.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name} ({c.code})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.country_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="website">
                                                Website
                                            </Label>
                                            <Input
                                                id="website"
                                                name="website"
                                                type="url"
                                                maxLength={255}
                                                value={companyWebsite}
                                                onChange={(event) =>
                                                    setCompanyWebsite(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.website}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card
                                    className={
                                        tab === 'documents' ? '' : 'hidden'
                                    }
                                >
                                    <CardHeader>
                                        <CardTitle>Company Documents</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CompanyProfileDocumentsCard
                                            companyProfileId={companyProfile.id}
                                            documents={companyProfile.documents ?? []}
                                            documentTypes={documentTypes}
                                            errors={errors}
                                        />
                                    </CardContent>
                                </Card>
                                <Card
                                    className={
                                        tab === 'email_signature' ? '' : 'hidden'
                                    }
                                >
                                    <CardHeader>
                                        <CardTitle>Signature Builder</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Configure the signature visually.
                                            HTML is generated automatically.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {!useAdvancedTemplate ? (
                                            <input
                                                type="hidden"
                                                name="signature_template"
                                                value={generatedTemplate}
                                            />
                                        ) : null}

                                        {hasNonBuilderTemplate ? (
                                            <div className="rounded-lg border border-amber-300/60 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                                                Existing saved template is
                                                custom HTML. Advanced HTML mode
                                                is enabled by default to prevent
                                                accidental overwrite.
                                            </div>
                                        ) : null}

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="signature_office_phone">
                                                    Office Phone (T)
                                                </Label>
                                                <Input
                                                    id="signature_office_phone"
                                                    value={
                                                        builderState.officePhone
                                                    }
                                                    onChange={(event) =>
                                                        setBuilderState(
                                                            (previous) => ({
                                                                ...previous,
                                                                officePhone:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="+971 4 299 0060"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="signature_website">
                                                    Website (W)
                                                </Label>
                                                <Input
                                                    id="signature_website"
                                                    value={builderState.website}
                                                    onChange={(event) => {
                                                        setSignatureWebsiteEdited(
                                                            true,
                                                        );
                                                        setBuilderState(
                                                            (previous) => ({
                                                                ...previous,
                                                                website:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        );
                                                    }}
                                                    placeholder="primelogistics.ae"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="signature_separator">
                                                Contact Separator
                                            </Label>
                                            <select
                                                id="signature_separator"
                                                value={
                                                    builderState.separatorStyle
                                                }
                                                onChange={(event) =>
                                                    setBuilderState(
                                                        (previous) => ({
                                                            ...previous,
                                                            separatorStyle:
                                                                event.target
                                                                    .value ===
                                                                'pipe'
                                                                    ? 'pipe'
                                                                    : 'letter_i',
                                                        }),
                                                    )
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                                            >
                                                <option value="letter_i">
                                                    I
                                                </option>
                                                <option value="pipe">|</option>
                                            </select>
                                        </div>

                                        <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                                            <p className="text-xs font-semibold text-foreground">
                                                Footer Logos
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {SIGNATURE_LOGO_LIBRARY.map(
                                                    (logo) => {
                                                        const active =
                                                            builderState.enabledLogoIds.includes(
                                                                logo.id,
                                                            );
                                                        return (
                                                            <Button
                                                                key={logo.id}
                                                                type="button"
                                                                variant={
                                                                    active
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    toggleLogo(
                                                                        logo.id,
                                                                    )
                                                                }
                                                            >
                                                                {logo.label}
                                                            </Button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setSignatureWebsiteEdited(
                                                        false,
                                                    );
                                                    setSignatureAddressSource(
                                                        'company_address_1',
                                                    );
                                                    setBuilderState({
                                                        ...defaultBuilderStateFromCompanyProfile(
                                                            {
                                                                company_address_1:
                                                                    companyAddress1,
                                                                company_address_2:
                                                                    companyAddress2,
                                                                website:
                                                                    companyWebsite,
                                                            },
                                                        ),
                                                        addressLine:
                                                            companyAddress1,
                                                    });
                                                }}
                                            >
                                                Reset to Default Design
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAdvancedOpen(true);
                                                    setUseAdvancedTemplate(
                                                        true,
                                                    );
                                                    setAdvancedTemplate(
                                                        generatedTemplate,
                                                    );
                                                }}
                                            >
                                                Insert Placeholders in HTML
                                            </Button>
                                        </div>

                                        <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                                            <p className="text-xs font-semibold text-foreground">
                                                Live Preview
                                            </p>
                                            <div className="mt-3">
                                                <EmployeeEmailSignatureCard
                                                    fullName="Test"
                                                    designation="IT Executive"
                                                    email="ahamed.mansoor@primelogistics.ae"
                                                    phone="+971 56 402 3643"
                                                    signatureTemplate={
                                                        generatedTemplate
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <details
                                            open={isAdvancedOpen}
                                            onToggle={(event) => {
                                                setIsAdvancedOpen(
                                                    event.currentTarget.open,
                                                );
                                            }}
                                            className="rounded-lg border border-border/80 bg-muted/25 p-3"
                                        >
                                            <summary className="cursor-pointer text-xs font-semibold text-foreground">
                                                Show Advanced HTML
                                            </summary>
                                            <div className="mt-3 grid gap-3">
                                                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            useAdvancedTemplate
                                                        }
                                                        onChange={(event) =>
                                                            setUseAdvancedTemplate(
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    Use advanced HTML for saving
                                                </label>
                                                <Textarea
                                                    ref={advancedTemplateRef}
                                                    id="signature_template_advanced"
                                                    name={
                                                        useAdvancedTemplate
                                                            ? 'signature_template'
                                                            : undefined
                                                    }
                                                    rows={14}
                                                    value={advancedTemplate}
                                                    onChange={(event) =>
                                                        setAdvancedTemplate(
                                                            event.target.value,
                                                        )
                                                    }
                                                    onPaste={(event) => {
                                                        void handleSignatureTemplatePaste(
                                                            event,
                                                        );
                                                    }}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Available placeholders:{' '}
                                                    {signatureTokens.join(
                                                        ' , ',
                                                    )}
                                                </p>
                                            </div>
                                        </details>

                                        <InputError
                                            message={errors.signature_template}
                                        />
                                        <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Name and designation style are
                                                fixed to your approved design.
                                                Use the builder controls above
                                                without writing HTML.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-3">
                                    <Button disabled={processing} type="submit">
                                        Update Company Profile
                                    </Button>
                                    <Link href={index()}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
