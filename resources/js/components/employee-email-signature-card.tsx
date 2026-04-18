import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { buildSignatureTokenMap, renderSanitizedSignatureHtml, signatureHtmlToPlainText } from '@/lib/signature-template';
import { Button } from '@/components/ui/button';

type SignatureCompanyProfile = {
    company_name: string;
    company_address_1?: string | null;
    company_address_2?: string | null;
    website?: string | null;
    office_phone?: string | null;
    signature_template?: string | null;
};

type EmployeeEmailSignatureCardProps = {
    fullName: string;
    designation?: string | null;
    email?: string | null;
    phone?: string | null;
    companyProfile?: SignatureCompanyProfile | null;
    signatureTemplate?: string | null;
};

const signatureFooterLogos = [
    { src: '/images/signature-prime-logistics.png', alt: 'Prime Logistics', htmlHeight: 20, className: 'h-[20px]' },
    { src: '/images/signature-primex.png', alt: 'PrimEx', htmlHeight: 14, className: 'h-[14px]' },
    { src: '/images/signature-cass.png', alt: 'CASS', htmlHeight: 17, className: 'h-[17px]' },
    { src: '/images/signature-elite.png', alt: 'Elite', htmlHeight: 18, className: 'h-[18px]' },
    { src: '/images/signature-gcc-aeo.png', alt: 'GCC AEO', htmlHeight: 18, className: 'h-[18px]' },
] as const;

const DEFAULT_SIGNATURE_OFFICE_PLACEHOLDER = 'office number';
const DEFAULT_SIGNATURE_MOBILE_PLACEHOLDER = 'employee phone number';
const SIGNATURE_WIDTH = 470;

function normalizeWebsiteLabel(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function normalizeWebsiteHref(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function buildAddress(companyProfile?: SignatureCompanyProfile | null): string {
    if (!companyProfile) {
        return '';
    }

    return [
        companyProfile.company_address_1,
        companyProfile.company_address_2,
    ]
        .filter((part): part is string => Boolean(part && part.trim() !== ''))
        .join(', ');
}

function renderCompanyNameHtml(name: string | null | undefined): string {
    const normalized = (name ?? 'Prime Logistics').trim();

    if (/^prime logistics$/i.test(normalized)) {
        return '<span style="color:#1d4f9b;">Prime</span> <span style="color:#f2b400;">Logistics</span>';
    }

    return normalized;
}

function normalizeSignatureEmail(value: string | null | undefined): string {
    const normalized = value?.trim() ?? '';

    if (normalized === '') {
        return '';
    }

    return /@example\.(com|org|net)$/i.test(normalized) ? '' : normalized;
}

function normalizeSignatureMobile(value: string | null | undefined): string {
    const normalized = value?.trim() ?? '';

    return normalized || DEFAULT_SIGNATURE_MOBILE_PLACEHOLDER;
}

function normalizeSignatureOfficePhone(
    value: string | null | undefined
): string {
    const normalized = value?.trim() ?? '';

    return normalized || DEFAULT_SIGNATURE_OFFICE_PLACEHOLDER;
}

function buildFallbackSignatureHtml({
    fullName,
    designation,
    email,
    phone,
    companyProfile,
}: EmployeeEmailSignatureCardProps): string {
    const address = buildAddress(companyProfile);
    const websiteLabel = normalizeWebsiteLabel(companyProfile?.website);
    const websiteHref = normalizeWebsiteHref(companyProfile?.website);
    const safeDesignation = designation?.trim() || 'Designation';
    const safeOfficePhone = normalizeSignatureOfficePhone(
        companyProfile?.office_phone
    );
    const safeMobile = normalizeSignatureMobile(phone);
    const safeEmail = normalizeSignatureEmail(email);
    const companyNameHtml = renderCompanyNameHtml(companyProfile?.company_name);

    return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Trebuchet MS', Arial, sans-serif; width:${SIGNATURE_WIDTH}px; color:#111827; border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="width:96px; vertical-align:top; padding:4px 8px;">
            <img src="${window.location.origin}/images/prime-logistics-mark.png" alt="Prime Logistics bird mark" style="display:block; width:58px; height:auto;" />
          </td>
          <td style="vertical-align:top; padding:4px 8px;">
            <div style="font-size:18px; font-weight:700; line-height:1.1; margin:0 0 2px 0;">${fullName}</div>
            <div style="font-size:17px; font-weight:400; font-style:italic; line-height:1.1; margin:0;">${safeDesignation}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:1px 0 0 0;">
            <div style="height:4px; width:230px; background:#f2b400; margin:0 0 3px 0;"></div>
            <div style="height:3px; width:300px; background:#1d4f9b; margin:0;"></div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 0 0 0;">
            <div style="font-size:15px; font-weight:700; line-height:1; margin:0 0 3px 0; display:inline-block; padding:2px 6px;">${companyNameHtml}</div>
            ${address ? `<div style="font-size:12px; line-height:1.3; margin:0 0 3px 0; padding:2px 6px;">${address}</div>` : ''}
            <div style="font-size:11px; line-height:1.4; margin:0 0 8px 0; padding:2px 6px;">
              <span style="font-weight:700;">T</span>&nbsp;<span style="font-weight:700;">${safeOfficePhone}</span>
              <span style="color:#f2b400; font-weight:700;">&nbsp;|&nbsp;</span>
              <span style="font-weight:700;">M</span>&nbsp;${safeMobile}
              <span style="color:#f2b400; font-weight:700;">&nbsp;|&nbsp;</span>
              <span style="font-weight:700;">W</span>&nbsp;<a href="${websiteHref || '#'}" style="color:#111827; text-decoration:none; font-weight:700;">${websiteLabel || 'primelogistics.ae'}</a>
            </div>
            ${safeEmail ? `<div style="font-size:13px; line-height:1.4; margin:0 0 10px 0;"><a href="mailto:${safeEmail}" style="color:#111827; text-decoration:none;">${safeEmail}</a></div>` : ''}
            <div style="display:flex; align-items:center; margin:0;">
              ${signatureFooterLogos
                  .map((logo, index) => {
                      const isLast = index === signatureFooterLogos.length - 1;
                      return `<div style="display:flex; align-items:center; justify-content:center; padding:4px 10px; margin-right:${isLast ? '0' : '2px'};"><img src="${window.location.origin}${logo.src}" alt="${logo.alt}" style="display:block; height:${logo.htmlHeight}px; width:auto; object-fit:contain;" /></div>`;
                  })
                  .join('')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

export function EmployeeEmailSignatureCard(
    props: EmployeeEmailSignatureCardProps
) {
    const [copied, setCopied] = useState(false);

    const template = (props.signatureTemplate ??
        props.companyProfile?.signature_template ??
        '').trim();
    const hasTemplate = template !== '';

    const tokenMap = useMemo(
        () =>
            buildSignatureTokenMap(
                {
                    full_name: props.fullName,
                    designation: props.designation,
                    email: props.email,
                    mobile: props.phone,
                },
                props.companyProfile
            ),
        [props.fullName, props.designation, props.email, props.phone, props.companyProfile]
    );

    const sanitizedTemplateHtml = useMemo(() => {
        if (!hasTemplate) {
            return '';
        }

        return renderSanitizedSignatureHtml(template, tokenMap);
    }, [hasTemplate, template, tokenMap]);

    const fallbackHtml = useMemo(() => buildFallbackSignatureHtml(props), [props]);
    const signatureHtml = hasTemplate ? sanitizedTemplateHtml : fallbackHtml;
    const signaturePlainText = useMemo(
        () => signatureHtmlToPlainText(signatureHtml),
        [signatureHtml]
    );

    async function copySignature(): Promise<void> {
        try {
            if (
                typeof ClipboardItem !== 'undefined' &&
                navigator.clipboard?.write
            ) {
                const item = new ClipboardItem({
                    'text/html': new Blob([signatureHtml], {
                        type: 'text/html',
                    }),
                    'text/plain': new Blob([signaturePlainText], {
                        type: 'text/plain',
                    }),
                });
                await navigator.clipboard.write([item]);
            } else {
                await navigator.clipboard.writeText(signaturePlainText);
            }

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            await navigator.clipboard.writeText(signaturePlainText);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        }
    }

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold">Email Signature</h3>
                    <p className="text-sm text-muted-foreground">
                        Generated signature preview in `Trebuchet MS`.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copySignature()}
                >
                    {copied ? (
                        <Check className="mr-2 size-4" />
                    ) : (
                        <Copy className="mr-2 size-4" />
                    )}
                    {copied ? 'Copied' : 'Copy signature'}
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                {hasTemplate ? (
                    <div
                        className="min-w-0 text-slate-900"
                        style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif" }}
                        dangerouslySetInnerHTML={{
                            __html: sanitizedTemplateHtml,
                        }}
                    />
                ) : (
                    <div
                        className="min-w-0 text-slate-900"
                        style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif" }}
                        dangerouslySetInnerHTML={{
                            __html: fallbackHtml,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

