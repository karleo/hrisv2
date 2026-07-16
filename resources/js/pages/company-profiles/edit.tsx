import { Head, Link, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    FileText,
    Globe,
    ImagePlus,
    Mail,
    MapPin,
} from 'lucide-react';
import {
    type ChangeEvent,
    type ClipboardEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import CompanyProfileController from '@/actions/App/Http/Controllers/CompanyProfileController';
import { CompanyProfileDocumentsCard } from '@/components/company-profile-documents-card';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
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

const companyProfileTabs: Array<{
    id: CompanyProfileTab;
    label: string;
    icon: typeof Building2;
}> = [
    { id: 'company_information', label: 'Company Information', icon: Building2 },
    { id: 'documents', label: 'Company Documents', icon: FileText },
    { id: 'email_signature', label: 'Email Signature', icon: Mail },
];

function FormSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm',
                className,
            )}
        >
            <div className="border-b border-border/60 bg-muted/20 px-5 py-4 md:px-6">
                <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
                {description ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="p-5 md:px-6 md:py-5">{children}</div>
        </section>
    );
}

function LogoUploadZone({
    label,
    description,
    preview,
    alt,
    uploadLabel,
    changeLabel,
    inputRef,
    registerInput,
    onChange,
    onUploadClick,
    name,
    error,
    compact = false,
}: {
    label?: string;
    description?: string;
    preview: string | null;
    alt: string;
    uploadLabel: string;
    changeLabel: string;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    registerInput?: (element: HTMLInputElement | null) => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onUploadClick?: () => void;
    name: string;
    error?: string;
    compact?: boolean;
}) {
    return (
        <div className="flex flex-col gap-3">
            {label || description ? (
                <div>
                    {label ? (
                        <p className="text-sm font-medium">{label}</p>
                    ) : null}
                    {description ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            {description}
                        </p>
                    ) : null}
                </div>
            ) : null}
            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/70 bg-muted/20 shadow-sm transition-colors hover:border-primary/40',
                        compact ? 'size-24' : 'size-32',
                    )}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt={alt}
                            className="size-full object-contain p-2"
                        />
                    ) : (
                        <span className="text-center text-muted-foreground">
                            <ImagePlus
                                className={cn(
                                    'mx-auto',
                                    compact ? 'size-6' : 'size-8',
                                )}
                            />
                            <span className="mt-1 block text-[10px]">
                                No logo
                            </span>
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                    <input
                        ref={(element) => {
                            if (inputRef) {
                                inputRef.current = element;
                            }
                            registerInput?.(element);
                        }}
                        type="file"
                        name={name}
                        accept="image/*"
                        className="sr-only"
                        onChange={onChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() =>
                            onUploadClick
                                ? onUploadClick()
                                : inputRef?.current?.click()
                        }
                    >
                        {preview ? changeLabel : uploadLabel}
                    </Button>
                    <InputError message={error} />
                </div>
            </div>
        </div>
    );
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
    const [companyName, setCompanyName] = useState(
        companyProfile.company_name,
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
        event: ClipboardEvent<HTMLTextAreaElement>,
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

    function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoPreview(companyProfile.logo_url);
        }
    }

    function handleBusinessCardLogoChange(
        e: ChangeEvent<HTMLInputElement>,
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
        e: ChangeEvent<HTMLInputElement>,
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

                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Edit Company Profile
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Update company profile details for{' '}
                        <span className="font-medium text-foreground">
                            {companyName}
                        </span>
                    </p>
                </div>

                <Form
                    {...CompanyProfileController.update.form(
                        companyProfile.id,
                    )}
                    className="flex flex-col gap-6"
                    encType="multipart/form-data"
                >
                    {({ processing, errors }) => (
                        <>
                            <nav className="overflow-x-auto rounded-2xl border border-border bg-card/90 p-2 shadow-sm backdrop-blur-sm">
                                <div className="flex min-w-max gap-2">
                                    {companyProfileTabs.map(
                                        ({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setTab(id)}
                                                className={cn(
                                                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                                                    tab === id
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                {label}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </nav>

                            <div
                                className={cn(
                                    'space-y-6',
                                    tab !== 'company_information' && 'hidden',
                                )}
                            >
                                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                                    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm xl:sticky xl:top-6 xl:self-start">
                                        <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
                                        <div className="flex flex-col items-center gap-4 p-5">
                                            <div className="relative flex aspect-square w-full max-w-[200px] items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="Company logo"
                                                        className="size-full object-contain p-3"
                                                    />
                                                ) : (
                                                    <span className="text-center text-muted-foreground">
                                                        <Building2 className="mx-auto size-10" />
                                                        <span className="mt-2 block text-xs">
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
                                                className="w-full max-w-[200px] rounded-lg"
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
                                            <div className="w-full space-y-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                                <p className="text-center text-base font-bold tracking-tight text-foreground">
                                                    {companyName ||
                                                        'Company name'}
                                                </p>
                                                {companyProfile.country ? (
                                                    <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
                                                        <MapPin className="size-3.5 shrink-0" />
                                                        {
                                                            companyProfile
                                                                .country.name
                                                        }
                                                    </p>
                                                ) : null}
                                                {companyWebsite ? (
                                                    <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
                                                        <Globe className="size-3.5 shrink-0" />
                                                        <span className="truncate">
                                                            {companyWebsite}
                                                        </span>
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <FormSection
                                            title="Business Card Logos"
                                            description="Logos used on employee business cards — front and back."
                                        >
                                            <div className="space-y-6">
                                                <LogoUploadZone
                                                    label="Front Logo"
                                                    description="Appears on the front side of employee business cards."
                                                    preview={
                                                        businessCardLogoPreview
                                                    }
                                                    alt="Business card logo"
                                                    uploadLabel="Upload front logo"
                                                    changeLabel="Change front logo"
                                                    inputRef={
                                                        businessCardLogoInputRef
                                                    }
                                                    onChange={
                                                        handleBusinessCardLogoChange
                                                    }
                                                    name="business_card_logo"
                                                    error={
                                                        errors.business_card_logo
                                                    }
                                                />

                                                <div className="border-t border-border/60 pt-6">
                                                    <p className="text-sm font-medium">
                                                        Back Logos
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                                        Upload up to four logos
                                                        for the back side of
                                                        the business card.
                                                    </p>
                                                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                                        {businessCardBackLogoSlots.map(
                                                            (slot) => (
                                                                <div
                                                                    key={slot}
                                                                    className="rounded-xl border border-border/60 bg-muted/10 p-4"
                                                                >
                                                                    <LogoUploadZone
                                                                        label={`Back Logo ${slot}`}
                                                                        preview={
                                                                            businessCardBackLogoPreviews[
                                                                                slot
                                                                            ]
                                                                        }
                                                                        alt={`Back logo ${slot}`}
                                                                        uploadLabel="Upload"
                                                                        changeLabel="Change"
                                                                        registerInput={(
                                                                            element,
                                                                        ) => {
                                                                            businessCardBackLogoInputRefs.current[
                                                                                slot
                                                                            ] =
                                                                                element;
                                                                        }}
                                                                        onUploadClick={() =>
                                                                            businessCardBackLogoInputRefs.current[
                                                                                slot
                                                                            ]?.click()
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            handleBusinessCardBackLogoChange(
                                                                                slot,
                                                                                event,
                                                                            )
                                                                        }
                                                                        name={`business_card_back_logo_${slot}`}
                                                                        error={
                                                                            errors[
                                                                                `business_card_back_logo_${slot}`
                                                                            ]
                                                                        }
                                                                        compact
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection
                                            title="Company Details"
                                            description="Core company information used across the system."
                                        >
                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div className="grid gap-2 md:col-span-2">
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
                                                        value={companyName}
                                                        onChange={(event) =>
                                                            setCompanyName(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.company_name
                                                        }
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
                                                                event.target
                                                                    .value,
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
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.company_address_2
                                                        }
                                                    />
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
                                                                {c.name} ({c.code}
                                                                )
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError
                                                        message={
                                                            errors.country_id
                                                        }
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
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={errors.website}
                                                    />
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection
                                            title="Signature Address"
                                            description="Choose which company address appears in the email signature."
                                        >
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/10 px-4 py-3 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
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
                                                            Company Address 1
                                                        </span>
                                                        <span className="text-muted-foreground mt-0.5 block text-xs">
                                                            {companyAddress1 ||
                                                                'No address entered'}
                                                        </span>
                                                    </span>
                                                </label>
                                                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/10 px-4 py-3 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
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
                                                            Company Address 2
                                                        </span>
                                                        <span className="text-muted-foreground mt-0.5 block text-xs">
                                                            {companyAddress2 ||
                                                                'No address entered'}
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                        </FormSection>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    tab !== 'documents' && 'hidden',
                                )}
                            >
                                <FormSection
                                    title="Company Documents"
                                    description="Upload and manage compliance documents with expiry tracking."
                                >
                                    <CompanyProfileDocumentsCard
                                        companyProfileId={companyProfile.id}
                                        documents={
                                            companyProfile.documents ?? []
                                        }
                                        documentTypes={documentTypes}
                                        errors={errors}
                                    />
                                </FormSection>
                            </div>

                            <div
                                className={cn(
                                    'space-y-6',
                                    tab !== 'email_signature' && 'hidden',
                                )}
                            >
                                {!useAdvancedTemplate ? (
                                    <input
                                        type="hidden"
                                        name="signature_template"
                                        value={generatedTemplate}
                                    />
                                ) : null}

                                {hasNonBuilderTemplate ? (
                                    <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
                                        Existing saved template is custom HTML.
                                        Advanced HTML mode is enabled by
                                        default to prevent accidental overwrite.
                                    </div>
                                ) : null}

                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
                                    <div className="space-y-6">
                                        <FormSection
                                            title="Contact Details"
                                            description="Office phone and website shown in the signature footer."
                                        >
                                            <div className="grid gap-4 sm:grid-cols-2">
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
                                                                        event
                                                                            .target
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
                                                        value={
                                                            builderState.website
                                                        }
                                                        onChange={(event) => {
                                                            setSignatureWebsiteEdited(
                                                                true,
                                                            );
                                                            setBuilderState(
                                                                (previous) => ({
                                                                    ...previous,
                                                                    website:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }),
                                                            );
                                                        }}
                                                        placeholder="primelogistics.ae"
                                                    />
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection
                                            title="Formatting"
                                            description="Separator style and footer accreditation logos."
                                        >
                                            <div className="space-y-5">
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
                                                                        event
                                                                            .target
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
                                                        <option value="pipe">
                                                            |
                                                        </option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium">
                                                        Footer Logos
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                                        Toggle accreditation
                                                        logos shown at the
                                                        bottom of the
                                                        signature.
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {SIGNATURE_LOGO_LIBRARY.map(
                                                            (logo) => {
                                                                const active =
                                                                    builderState.enabledLogoIds.includes(
                                                                        logo.id,
                                                                    );
                                                                return (
                                                                    <Button
                                                                        key={
                                                                            logo.id
                                                                        }
                                                                        type="button"
                                                                        variant={
                                                                            active
                                                                                ? 'default'
                                                                                : 'outline'
                                                                        }
                                                                        size="sm"
                                                                        className="rounded-lg"
                                                                        onClick={() =>
                                                                            toggleLogo(
                                                                                logo.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            logo.label
                                                                        }
                                                                    </Button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </FormSection>

                                        <FormSection
                                            title="Actions"
                                            description="Reset the design or switch to advanced HTML editing."
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-lg"
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
                                                    className="rounded-lg"
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
                                            <p className="text-muted-foreground mt-4 text-xs">
                                                Name and designation style are
                                                fixed to your approved design.
                                                Use the builder controls above
                                                without writing HTML.
                                            </p>
                                        </FormSection>

                                        <details
                                            open={isAdvancedOpen}
                                            onToggle={(event) => {
                                                setIsAdvancedOpen(
                                                    event.currentTarget.open,
                                                );
                                            }}
                                            className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
                                        >
                                            <summary className="cursor-pointer border-b border-border/60 bg-muted/20 px-5 py-4 text-sm font-semibold tracking-tight md:px-6">
                                                Advanced HTML Editor
                                            </summary>
                                            <div className="space-y-3 p-5 md:px-6 md:py-5">
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
                                                    className="font-mono text-xs"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Available placeholders:{' '}
                                                    {signatureTokens.join(', ')}
                                                </p>
                                            </div>
                                        </details>

                                        <InputError
                                            message={errors.signature_template}
                                        />
                                    </div>

                                    <div className="xl:sticky xl:top-6 xl:self-start">
                                        <FormSection
                                            title="Live Preview"
                                            description="See how the signature will appear in emails."
                                        >
                                            <EmployeeEmailSignatureCard
                                                fullName="Test"
                                                designation="IT Executive"
                                                email="ahamed.mansoor@primelogistics.ae"
                                                phone="+971 56 402 3643"
                                                signatureTemplate={
                                                    generatedTemplate
                                                }
                                            />
                                        </FormSection>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-3 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-sm md:-mx-6 md:px-6">
                                <Button
                                    disabled={processing}
                                    type="submit"
                                    className="rounded-lg"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : 'Update Company Profile'}
                                </Button>
                                <Link href={index()}>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
