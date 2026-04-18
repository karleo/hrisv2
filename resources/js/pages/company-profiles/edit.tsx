import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import CompanyProfileController from '@/actions/App/Http/Controllers/CompanyProfileController';
import { EmployeeEmailSignatureCard } from '@/components/employee-email-signature-card';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import AppLayout from '@/layouts/app-layout';
import { edit, index } from '@/routes/company-profiles';
import type { BreadcrumbItem } from '@/types';

type CountryOption = {
    id: number;
    code: string;
    name: string;
};

type CompanyProfile = {
    id: number;
    logo: string | null;
    logo_url: string | null;
    company_name: string;
    company_address_1: string | null;
    company_address_2: string | null;
    country_id: number | null;
    website: string | null;
    signature_template: string | null;
    country: CountryOption | null;
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

export default function Edit({
    companyProfile,
    countries,
}: {
    companyProfile: CompanyProfile;
    countries: CountryOption[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Company Profiles', href: index().url },
        {
            title: companyProfile.company_name,
            href: edit({ company_profile: companyProfile.id }).url,
        },
    ];

    const logoInputRef = useRef<HTMLInputElement>(null);
    const advancedTemplateRef = useRef<HTMLTextAreaElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        companyProfile.logo_url
    );
    const [companyAddress1, setCompanyAddress1] = useState(
        companyProfile.company_address_1 ?? ''
    );
    const [companyAddress2, setCompanyAddress2] = useState(
        companyProfile.company_address_2 ?? ''
    );
    const [companyWebsite, setCompanyWebsite] = useState(
        companyProfile.website ?? ''
    );
    const [signatureAddressEdited, setSignatureAddressEdited] = useState(false);
    const [signatureWebsiteEdited, setSignatureWebsiteEdited] = useState(false);

    const defaultStateFromCompany = useMemo(
        () =>
            defaultBuilderStateFromCompanyProfile({
                company_address_1: companyAddress1,
                company_address_2: companyAddress2,
                website: companyWebsite,
            }),
        [companyAddress1, companyAddress2, companyWebsite]
    );
    const parsedBuilderState =
        companyProfile.signature_template &&
        isBuilderSignatureTemplate(companyProfile.signature_template)
            ? parseBuilderStateFromTemplate(companyProfile.signature_template)
            : null;
    const [builderState, setBuilderState] = useState<SignatureBuilderState>(
        parsedBuilderState
            ? {
                  ...parsedBuilderState,
                  addressLine: defaultStateFromCompany.addressLine,
                  website: defaultStateFromCompany.website,
              }
            : defaultStateFromCompany
    );
    const hasNonBuilderTemplate =
        (companyProfile.signature_template?.trim() ?? '') !== '' &&
        !isBuilderSignatureTemplate(companyProfile.signature_template ?? '');
    const [useAdvancedTemplate, setUseAdvancedTemplate] = useState(
        hasNonBuilderTemplate
    );
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(hasNonBuilderTemplate);
    const [advancedTemplate, setAdvancedTemplate] = useState(
        companyProfile.signature_template?.trim() ||
            buildDefaultSignatureTemplate(undefined, {
                company_address_1: companyProfile.company_address_1,
                company_address_2: companyProfile.company_address_2,
                website: companyProfile.website,
            })
    );

    const generatedTemplate = useMemo(
        () => applyBuilderStateToTemplate(builderState),
        [builderState]
    );

    useEffect(() => {
        if (!signatureAddressEdited) {
            setBuilderState((previous) => ({
                ...previous,
                addressLine: defaultStateFromCompany.addressLine,
            }));
        }
    }, [defaultStateFromCompany.addressLine, signatureAddressEdited]);

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
        event: React.ClipboardEvent<HTMLTextAreaElement>
    ): Promise<void> {
        const imageItem = Array.from(event.clipboardData.items).find((item) =>
            item.type.startsWith('image/')
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
            window.alert('Pasted image is too large. Please use an image under 1 MB.');

            return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Failed to read pasted image.'));
            reader.readAsDataURL(imageFile);
        });

        const alt = (imageFile.name || 'Pasted logo')
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
        insertIntoAdvancedTemplate(
            `<img src="${dataUrl}" alt="${alt}" style="display:block; height:18px; width:auto; object-fit:contain;" />`
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
                            companyProfile.id
                        )}
                        className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]"
                        encType="multipart/form-data"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Company Information</CardTitle>
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
                                                <InputError message={errors.logo} />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="company_name">
                                                Company Name{' '}
                                                <span className="text-destructive">*</span>
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
                                                        event.target.value
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
                                                        event.target.value
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
                                                    companyProfile.country_id ?? ''
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.website}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3">
                                        <Button
                                            disabled={processing}
                                            type="submit"
                                        >
                                            Update Company Profile
                                        </Button>
                                        <Link href={index()}>
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                                <Card className="h-fit">
                                    <CardHeader>
                                        <CardTitle>Signature Builder</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Configure the signature visually. HTML is generated automatically.
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
                                                Existing saved template is custom HTML. Advanced HTML mode is enabled by default to prevent accidental overwrite.
                                            </div>
                                        ) : null}

                                        <div className="grid gap-2">
                                            <Label htmlFor="signature_address_line">
                                                Address Line
                                            </Label>
                                            <Input
                                                id="signature_address_line"
                                                value={builderState.addressLine}
                                                onChange={(event) =>
                                                    {
                                                        setSignatureAddressEdited(
                                                            true
                                                        );
                                                        setBuilderState(
                                                            (previous) => ({
                                                                ...previous,
                                                                addressLine:
                                                                    event.target
                                                                        .value,
                                                            })
                                                        );
                                                    }
                                                }
                                                placeholder="Warehouse G-09, DAFZA, Po Box: 371961, Dubai ,UAE"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="signature_office_phone">
                                                    Office Phone (T)
                                                </Label>
                                                <Input
                                                    id="signature_office_phone"
                                                    value={builderState.officePhone}
                                                    onChange={(event) =>
                                                        setBuilderState(
                                                            (previous) => ({
                                                                ...previous,
                                                                officePhone:
                                                                    event.target
                                                                        .value,
                                                            })
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
                                                    onChange={(event) =>
                                                        {
                                                            setSignatureWebsiteEdited(
                                                                true
                                                            );
                                                            setBuilderState(
                                                                (previous) => ({
                                                                    ...previous,
                                                                    website:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            );
                                                        }
                                                    }
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
                                                value={builderState.separatorStyle}
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
                                                        })
                                                    )
                                                }
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px]"
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
                                                                logo.id
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
                                                                        logo.id
                                                                    )
                                                                }
                                                            >
                                                                {logo.label}
                                                            </Button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    {
                                                        setSignatureAddressEdited(
                                                            false
                                                        );
                                                        setSignatureWebsiteEdited(
                                                            false
                                                        );
                                                        setBuilderState(
                                                            defaultBuilderStateFromCompanyProfile(
                                                                {
                                                                    company_address_1:
                                                                        companyAddress1,
                                                                    company_address_2:
                                                                        companyAddress2,
                                                                    website:
                                                                        companyWebsite,
                                                                }
                                                            )
                                                        );
                                                    }
                                                }
                                            >
                                                Reset to Default Design
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAdvancedOpen(true);
                                                    setUseAdvancedTemplate(true);
                                                    setAdvancedTemplate(
                                                        generatedTemplate
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
                                                    fullName="Ahamed Mansoor"
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
                                                    event.currentTarget.open
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
                                                                    .checked
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
                                                            event.target.value
                                                        )
                                                    }
                                                    onPaste={(event) => {
                                                        void handleSignatureTemplatePaste(
                                                            event
                                                        );
                                                    }}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Available placeholders: {signatureTokens.join(' , ')}
                                                </p>
                                            </div>
                                        </details>

                                        <InputError
                                            message={errors.signature_template}
                                        />
                                        <div className="rounded-lg border border-border/80 bg-muted/25 p-3">
                                            <p className="text-xs text-muted-foreground">
                                                Name and designation style are fixed to your approved design.
                                                Use the builder controls above without writing HTML.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
