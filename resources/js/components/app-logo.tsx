export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md border border-sidebar-border/60 bg-white p-1 dark:bg-black">
                <img
                    src="/images/prime-logistics-mark.png"
                    alt="Prime Logistics"
                    className="size-full object-contain"
                    loading="eager"
                    decoding="async"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Prime Logistics
                </span>
            </div>
        </>
    );
}
