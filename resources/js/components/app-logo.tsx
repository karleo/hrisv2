import { useI18n } from '@/lib/i18n';

export default function AppLogo() {
    const { t } = useI18n();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md border border-sidebar-border/70 bg-white p-1 shadow-sm">
                <img
                    src="/images/prime-logistics-mark.png"
                    alt={t('sidebar.companyName', 'Prime Logistics')}
                    className="size-full object-contain"
                    loading="eager"
                    decoding="async"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {t('sidebar.companyName', 'Prime Logistics')}
                </span>
            </div>
        </>
    );
}
