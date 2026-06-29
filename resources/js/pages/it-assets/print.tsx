import { Head, Link } from '@inertiajs/react';
import JsBarcode from 'jsbarcode';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ItAssetController from '@/actions/App/Http/Controllers/ItAssetController';

type Asset = {
    id: number;
    code: string;
    name: string;
    purchase_date: string | null;
    asset_value: string | null;
    asset_currency: string | null;
    hardware_asset_value?: {
        asset_value: string | null;
        asset_currency: string | null;
    } | null;
};

function formatDate(ymd: string | null): string {
    if (!ymd) {
        return '—';
    }

    const [year, month, day] = ymd.split('-');
    if (!year || !month || !day) {
        return ymd;
    }

    return `${day}/${month}/${year}`;
}

function formatMoney(value: string | null | undefined, currency: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    const formatted = Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return currency ? `${formatted} ${currency}` : formatted;
}

export default function Print({ asset }: { asset: Asset }) {
    const barcodeRef = useRef<SVGSVGElement>(null);

    const displayValue = formatMoney(asset.asset_value, asset.asset_currency)
        !== '—'
        ? formatMoney(asset.asset_value, asset.asset_currency)
        : formatMoney(asset.hardware_asset_value?.asset_value, asset.hardware_asset_value?.asset_currency);

    useEffect(() => {
        if (!barcodeRef.current) {
            return;
        }

        JsBarcode(barcodeRef.current, asset.code, {
            format: 'CODE128',
            width: 1.2,
            height: 36,
            displayValue: true,
            fontSize: 10,
            margin: 0,
        });
    }, [asset.code]);

    const handlePrint = () => window.print();

    return (
        <>
            <Head title={`Label ${asset.code}`} />

            <div className="asset-label-print-root min-h-screen bg-neutral-100 p-4 print:bg-white print:p-0">
                <div className="no-print mx-auto mb-4 flex max-w-sm items-center justify-between gap-3">
                    <Link
                        href={ItAssetController.show.url(asset.id)}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to asset
                    </Link>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
                    >
                        <Printer className="size-4" />
                        Print
                    </button>
                </div>

                <div className="mx-auto flex max-w-sm justify-center print:mx-0 print:max-w-none">
                    <article className="asset-label-card w-[58mm] rounded-md border border-neutral-300 bg-white p-2 shadow-sm print:w-[58mm] print:rounded-none print:border print:border-black print:p-1.5 print:shadow-none">
                        <p className="truncate text-center text-[9px] font-semibold uppercase tracking-wide text-neutral-800">
                            {asset.name}
                        </p>
                        <div className="mt-1 flex justify-center overflow-hidden">
                            <svg ref={barcodeRef} className="max-w-full" />
                        </div>
                        <div className="mt-1 space-y-0.5 text-center text-[8px] leading-tight text-neutral-700">
                            <p>
                                <span className="font-medium">Purchased:</span> {formatDate(asset.purchase_date)}
                            </p>
                            <p>
                                <span className="font-medium">Value:</span> {displayValue}
                            </p>
                        </div>
                    </article>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: 58mm 40mm;
                        margin: 2mm;
                    }
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .asset-label-print-root {
                        min-height: auto !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </>
    );
}
