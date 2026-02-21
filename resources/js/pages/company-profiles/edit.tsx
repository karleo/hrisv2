import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import CompanyProfileController from '@/actions/App/Http/Controllers/CompanyProfileController';
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
    country: CountryOption | null;
};

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
    const [logoPreview, setLogoPreview] = useState<string | null>(
        companyProfile.logo_url
    );

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

                <div className="max-w-2xl">
                    <Form
                        {...CompanyProfileController.update.form(
                            companyProfile.id
                        )}
                        className="w-full"
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
                                                defaultValue={
                                                    companyProfile.company_address_1 ??
                                                    ''
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
                                                defaultValue={
                                                    companyProfile.company_address_2 ??
                                                    ''
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
                                                className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                defaultValue={
                                                    companyProfile.website ?? ''
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
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
