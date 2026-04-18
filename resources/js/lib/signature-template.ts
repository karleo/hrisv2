import DOMPurify from 'dompurify';

export type SignatureTemplateTokenMap = Record<string, string>;
const SIGNATURE_BUILDER_MARKER = 'data-signature-builder="v1"';

export const SIGNATURE_LOGO_LIBRARY = [
    { id: 'prime', label: 'Prime', src: '/images/signature-prime-logistics.png', alt: 'Prime Logistics', height: 20 },
    { id: 'primex', label: 'PrimEx', src: '/images/signature-primex.png', alt: 'PrimEx', height: 14 },
    { id: 'cass', label: 'CASS', src: '/images/signature-cass.png', alt: 'CASS', height: 17 },
    { id: 'elite', label: 'Elite', src: '/images/signature-elite.png', alt: 'Elite', height: 18 },
    { id: 'gcc_aeo', label: 'GCC AEO', src: '/images/signature-gcc-aeo.png', alt: 'GCC AEO', height: 18 },
] as const;

export type SignatureLogoId = (typeof SIGNATURE_LOGO_LIBRARY)[number]['id'];
export type SignatureSeparatorStyle = 'pipe' | 'letter_i';

export type SignatureBuilderState = {
    addressLine: string;
    officePhone: string;
    website: string;
    separatorStyle: SignatureSeparatorStyle;
    enabledLogoIds: SignatureLogoId[];
};

type SignatureCompanyPayload = {
    company_name?: string | null;
    company_address_1?: string | null;
    company_address_2?: string | null;
    website?: string | null;
};

type SignatureEmployeePayload = {
    full_name?: string | null;
    designation?: string | null;
    email?: string | null;
    mobile?: string | null;
};

function normalizeTokenValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeHtmlAttribute(value: string): string {
    return escapeHtml(value).replaceAll('`', '&#96;');
}

function normalizeWebsiteLabel(value: string): string {
    return value.replace(/^https?:\/\//i, '').replace(/\/$/, '').trim();
}

function buildDefaultAddress(company?: SignatureCompanyPayload | null): string {
    return [company?.company_address_1, company?.company_address_2]
        .map((part) => normalizeTokenValue(part))
        .filter((part) => part !== '')
        .join(', ');
}

function normalizeLogoIds(ids: string[]): SignatureLogoId[] {
    const allowed = new Set(SIGNATURE_LOGO_LIBRARY.map((logo) => logo.id));
    const unique = Array.from(new Set(ids));
    const filtered = unique.filter((id): id is SignatureLogoId =>
        allowed.has(id as SignatureLogoId)
    );

    return filtered.length > 0
        ? filtered
        : SIGNATURE_LOGO_LIBRARY.map((logo) => logo.id);
}

export function defaultBuilderStateFromCompanyProfile(
    company?: SignatureCompanyPayload | null
): SignatureBuilderState {
    return {
        addressLine:
            buildDefaultAddress(company) ||
            'Warehouse G-09, DAFZA, Po Box: 371961, Dubai ,UAE',
        officePhone: '+971 4 299 0060',
        website: normalizeWebsiteLabel(
            normalizeTokenValue(company?.website) || 'primelogistics.ae'
        ),
        separatorStyle: 'letter_i',
        enabledLogoIds: SIGNATURE_LOGO_LIBRARY.map((logo) => logo.id),
    };
}

function separatorForStyle(style: SignatureSeparatorStyle): string {
    return style === 'letter_i' ? 'I' : '|';
}

function stripHtmlTags(value: string): string {
    return value.replace(/<[^>]*>/g, '');
}

export function applyBuilderStateToTemplate(
    state: SignatureBuilderState
): string {
    const normalizedState: SignatureBuilderState = {
        addressLine:
            normalizeTokenValue(state.addressLine) ||
            'Warehouse G-09, DAFZA, Po Box: 371961, Dubai ,UAE',
        officePhone:
            normalizeTokenValue(state.officePhone) || '+971 4 299 0060',
        website:
            normalizeWebsiteLabel(normalizeTokenValue(state.website)) ||
            'primelogistics.ae',
        separatorStyle: state.separatorStyle,
        enabledLogoIds: normalizeLogoIds(state.enabledLogoIds),
    };

    const separator = separatorForStyle(normalizedState.separatorStyle);
    const selectedFooterLogos = SIGNATURE_LOGO_LIBRARY
        .filter((logo) => normalizedState.enabledLogoIds.includes(logo.id))
        .map((logo) => ({
            ...logo,
            html: `<img src="${logo.src}" alt="${escapeHtmlAttribute(
                    logo.alt
                )}" style="display:block; height:${logo.height}px; width:auto; object-fit:contain;" />`
        }));
    const footerLogos = selectedFooterLogos
        .map((logo, index) => {
            const isLast = index === selectedFooterLogos.length - 1;
            return `<div style="display:flex; align-items:center; justify-content:center; padding:4px 10px; margin-right:${isLast ? '0' : '2px'};">${logo.html}</div>`;
        })
        .join('');

    return `
<table ${SIGNATURE_BUILDER_MARKER} cellpadding="0" cellspacing="0" border="0" style="font-family:'Trebuchet MS', Arial, sans-serif; width:470px; color:#111827; border-collapse:collapse;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="width:96px; vertical-align:top; padding:4px 8px;">
            <img src="/images/prime-logistics-mark.png" alt="Prime Logistics bird mark" style="display:block; width:58px; height:auto;" />
          </td>
          <td style="vertical-align:top; padding:4px 8px;">
            <div style="font-size:18px; font-weight:700; line-height:1.1; margin:0 0 2px 0;">{{full_name}}</div>
            <div style="font-size:17px; font-weight:400; font-style:italic; line-height:1.1; margin:0;">{{designation}}</div>
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
            <div style="font-size:15px; font-weight:700; line-height:1; margin:0 0 3px 0; display:inline-block; padding:2px 6px;">
              <span style="color:#1d4f9b;">Prime</span> <span style="color:#f2b400;">Logistics</span>
            </div>
            <div style="font-size:12px; line-height:1.3; margin:0 0 3px 0; padding:2px 6px;">${escapeHtml(
                normalizedState.addressLine
            )}</div>
            <div style="font-size:11px; line-height:1.4; margin:0 0 8px 0; padding:2px 6px;">
              <span style="font-weight:700;">T</span>&nbsp;<span style="font-weight:700;">${escapeHtml(
                  normalizedState.officePhone
              )}</span>
              <span style="color:#f2b400; font-weight:700;">&nbsp;${separator}&nbsp;</span>
              <span style="font-weight:700;">M</span>&nbsp;{{mobile}}
              <span style="color:#f2b400; font-weight:700;">&nbsp;${separator}&nbsp;</span>
              <span style="font-weight:700;">W</span>&nbsp;${escapeHtml(
                  normalizedState.website
              )}
            </div>
            <div style="display:flex; align-items:center; margin:0;">
              ${footerLogos}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`.trim();
}

export function buildDefaultSignatureTemplate(
    stateOverrides?: Partial<SignatureBuilderState>,
    company?: SignatureCompanyPayload | null
): string {
    const state = {
        ...defaultBuilderStateFromCompanyProfile(company),
        ...(stateOverrides ?? {}),
    };

    return applyBuilderStateToTemplate(state);
}

export function isBuilderSignatureTemplate(template: string): boolean {
    return template.includes(SIGNATURE_BUILDER_MARKER);
}

export function parseBuilderStateFromTemplate(
    template: string
): SignatureBuilderState | null {
    if (!isBuilderSignatureTemplate(template)) {
        return null;
    }

    const defaultState = defaultBuilderStateFromCompanyProfile(null);

    const addressMatch = template.match(
        /font-size:12px; line-height:1\.35; margin:0 0 4px 0;">([\s\S]*?)<\/div>/
    );
    const phoneMatch = template.match(
        /<span style="font-weight:700;">T<\/span>&nbsp;([\s\S]*?)\s*<span style="color:#f2b400; font-weight:700;">&nbsp;([I|])&nbsp;<\/span>/
    );
    const websiteMatch = template.match(
        /<span style="font-weight:700;">W<\/span>&nbsp;([\s\S]*?)\s*<\/div>/
    );

    const enabledLogoIds = SIGNATURE_LOGO_LIBRARY.filter((logo) =>
        template.includes(`src="${logo.src}"`)
    ).map((logo) => logo.id);

    return {
        addressLine: stripHtmlTags(
            (addressMatch?.[1] ?? defaultState.addressLine).replace(
                /<br\s*\/?>/gi,
                ', '
            )
        )
            .replace(/&nbsp;/g, ' ')
            .trim(),
        officePhone: stripHtmlTags(phoneMatch?.[1] ?? defaultState.officePhone)
            .replace(/&nbsp;/g, ' ')
            .trim(),
        website: stripHtmlTags(websiteMatch?.[1] ?? defaultState.website)
            .replace(/&nbsp;/g, ' ')
            .trim(),
        separatorStyle:
            (phoneMatch?.[2] ?? 'I') === '|' ? 'pipe' : 'letter_i',
        enabledLogoIds:
            enabledLogoIds.length > 0
                ? enabledLogoIds
                : defaultState.enabledLogoIds,
    };
}

export const DEFAULT_SIGNATURE_TEMPLATE_HTML = buildDefaultSignatureTemplate();

export function buildSignatureTokenMap(
    employee: SignatureEmployeePayload,
    company?: SignatureCompanyPayload | null
): SignatureTemplateTokenMap {
    return {
        full_name: normalizeTokenValue(employee.full_name),
        designation: normalizeTokenValue(employee.designation),
        email: normalizeTokenValue(employee.email),
        mobile: normalizeTokenValue(employee.mobile),
        company_name: normalizeTokenValue(company?.company_name),
        company_address_1: normalizeTokenValue(company?.company_address_1),
        company_address_2: normalizeTokenValue(company?.company_address_2),
        website: normalizeTokenValue(company?.website),
    };
}

export function replaceSignatureTokens(
    template: string,
    tokenMap: SignatureTemplateTokenMap
): string {
    return template.replace(
        /\{\{\s*(\$?[a-zA-Z0-9_]+)\s*\}\}/g,
        (match, token) => {
            const normalizedToken = token.replace(/^\$/, '').toLowerCase();
            if (!(normalizedToken in tokenMap)) {
                return match;
            }

            return tokenMap[normalizedToken] ?? '';
        }
    );
}

export function replaceLegacySignatureTokens(
    template: string,
    tokenMap: SignatureTemplateTokenMap
): string {
    return template.replace(/\{\s*(\$?[a-zA-Z0-9_]+)\s*\}/g, (match, token) => {
        const normalizedToken = token.replace(/^\$/, '').toLowerCase();
        if (!(normalizedToken in tokenMap)) {
            return match;
        }

        return tokenMap[normalizedToken] ?? '';
    });
}

export function formatSignatureTemplate(rawTemplate: string): string {
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawTemplate);
    if (hasHtmlTags) {
        return rawTemplate;
    }

    return escapeHtml(rawTemplate).replace(/\r?\n/g, '<br>');
}

export function sanitizeSignatureHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style'],
    });
}

function keepOnlyFirstBirdLogo(html: string): string {
    let birdLogoCount = 0;

    return html.replace(
        /<img\b[^>]*src=(['"])(?:https?:\/\/[^'"]+)?\/?images\/prime-logistics-mark\.png\1[^>]*>/gi,
        (match) => {
            birdLogoCount += 1;
            return birdLogoCount === 1 ? match : '';
        }
    );
}

export function renderSanitizedSignatureHtml(
    template: string,
    tokenMap: SignatureTemplateTokenMap
): string {
    const normalizedTemplate = isBuilderSignatureTemplate(template)
        ? applyBuilderStateToTemplate(
              parseBuilderStateFromTemplate(template) ??
                  defaultBuilderStateFromCompanyProfile(null)
          )
        : template;

    const replaced = replaceLegacySignatureTokens(
        replaceSignatureTokens(normalizedTemplate, tokenMap),
        tokenMap
    );
    const formatted = formatSignatureTemplate(replaced);
    const normalized = keepOnlyFirstBirdLogo(formatted);

    return sanitizeSignatureHtml(normalized);
}

export function signatureHtmlToPlainText(html: string): string {
    if (typeof window === 'undefined') {
        return html;
    }

    const container = window.document.createElement('div');
    container.innerHTML = html;

    return container.textContent ?? '';
}
