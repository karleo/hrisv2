<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Business Card</title>
    <style>
        body {
            margin: 0;
            font-family: "Trebuchet MS", Arial, sans-serif;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            min-height: 100vh;
        }
        .card {
            width: min(920px, 96vw);
            aspect-ratio: 940 / 500;
            overflow: hidden;
            border: 1px solid #dcdcdc;
            background: #fff;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 7% 7% 0;
        }
        .identity {
            min-width: 0;
        }
        .name {
            font-size: clamp(24px, 4vw, 48px);
            font-weight: 700;
            line-height: 1;
            letter-spacing: -0.03em;
            color: #07134f;
        }
        .title {
            margin-top: 8px;
            font-size: clamp(16px, 2.5vw, 28px);
            font-weight: 700;
            color: #2077ad;
            line-height: 1.15;
        }
        .logo {
            margin-left: 20px;
            width: 28%;
            height: clamp(72px, 12vw, 144px);
            object-fit: contain;
            object-position: right top;
        }
        .details {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1fr auto 1.25fr;
            gap: 6%;
            align-items: start;
            padding: 0 7% 8%;
        }
        .address,
        .contact {
            min-width: 0;
            font-size: clamp(15px, 2.3vw, 25px);
            line-height: 1.22;
            color: #1e2744;
        }
        .company {
            margin: 0 0 8px;
            font-weight: 700;
            color: #2077ad;
        }
        .address p,
        .contact p {
            margin: 0;
        }
        .divider {
            width: 4px;
            min-height: 112px;
            height: 100%;
            background: #f2c500;
        }
        .contact {
            display: flex;
            flex-direction: column;
            gap: 8px;
            line-height: 1.1;
        }
        .label {
            font-weight: 700;
            color: #2077ad;
        }
        .website {
            padding-top: 16px;
        }
        .bottom-bar {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 4%;
            background: #f2c500;
        }
        .back-card {
            position: relative;
            overflow: hidden;
        }
        .back-logo-1 {
            position: absolute;
            left: 7%;
            top: 13%;
            width: 39%;
            max-height: 136px;
            object-fit: contain;
            transform: scale(1.25);
        }
        .back-logo-2 {
            position: absolute;
            right: 7%;
            top: 18%;
            width: 39%;
            max-height: 136px;
            object-fit: contain;
            transform: scale(2.1);
        }
        .back-logo-3 {
            position: absolute;
            left: 31%;
            top: 49%;
            width: 20%;
            max-height: 35px;
            object-fit: contain;
            transform: scale(1);
        }
        .back-logo-4 {
            position: absolute;
            right: 27%;
            top: 49%;
            width: 22%;
            max-height: 61px;
            object-fit: contain;
            transform: scale(1.45);
        }
        .back-footer {
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            height: 35%;
        }
        .back-qr {
            position: absolute;
            right: 3%;
            bottom: 4%;
            width: 112px;
            height: 112px;
            background: #fff;
            padding: 8px;
        }
        @media print {
            .card {
                width: 3.76in;
                height: 2in;
                box-shadow: none;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    @php
        $companyName = $employee->companyProfile?->company_name ?? $appName;
        $addressParts = array_values(array_filter([
            $employee->companyProfile?->company_address_1,
            $employee->companyProfile?->company_address_2,
        ]));
        $website = preg_replace('/^https?:\/\//i', '', (string) ($employee->companyProfile?->website ?? ''));
        $website = rtrim($website, '/');
        $logoUrl = $employee->company_logo_url ?: ($employee->companyProfile?->business_card_logo_url ?: ($employee->companyProfile?->logo_url ?: '/images/prime-logistics-mark.png'));
        $uploadedBackLogoUrls = $employee->companyProfile?->business_card_back_logo_urls ?? [];
        $backLogoUrls = [];
        foreach ($uploadedBackLogoUrls as $index => $backLogoUrl) {
            if ($backLogoUrl) {
                $backLogoUrls[$index + 1] = $backLogoUrl;
            }
        }
    @endphp
    <div class="card">
        <div class="header">
            <div class="identity">
                <div class="name">{{ trim($employee->first_name.' '.$employee->last_name) }}</div>
                <div class="title">{{ $employee->jobPosition?->name ?: 'Designation' }}</div>
            </div>
            <img class="logo" src="{{ $logoUrl }}" alt="">
        </div>
        <div class="details">
            <div class="address">
                <p class="company">{{ $companyName }}</p>
                @forelse ($addressParts as $part)
                    <p>{{ $part }}</p>
                @empty
                    <p>Company address</p>
                @endforelse
            </div>
            <div class="divider"></div>
            <div class="contact">
                @if (!empty($employee->email_address))
                    <p><span class="label">E:</span> {{ $employee->email_address }}</p>
                @endif
                @if (!empty($employee->contact_number))
                    <p><span class="label">M:</span> {{ $employee->contact_number }}</p>
                @endif
                <p><span class="label">T:</span> +971 4 339 7059</p>
                @if ($website !== '')
                    <p class="website">{{ $website }}</p>
                @endif
            </div>
        </div>
        <div class="bottom-bar"></div>
    </div>

    <div class="card back-card">
        @foreach ($backLogoUrls as $slot => $backLogoUrl)
            <img class="back-logo-{{ $slot }}" src="{{ $backLogoUrl }}" alt="Business card back logo {{ $slot }}">
        @endforeach
        <svg class="back-footer" viewBox="0 0 940 175" preserveAspectRatio="none" aria-hidden="true">
            <path fill="#f2c500" d="M0 12 C165 42 315 92 470 104 C630 116 770 56 940 12 L940 54 C770 86 635 129 470 122 C310 115 170 70 0 42 Z" />
            <path fill="#f2c500" d="M0 104 C170 128 330 145 500 142 C665 139 802 104 940 82 L940 175 L0 175 Z" />
        </svg>
        <img class="back-qr" src="{{ $qrCodeUrl }}" alt="vCard QR code for {{ trim($employee->first_name.' '.$employee->last_name) }}">
    </div>
</body>
</html>

