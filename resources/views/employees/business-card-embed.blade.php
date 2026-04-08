<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Business Card</title>
    <style>
        body {
            margin: 0;
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .card {
            width: 336px;
            aspect-ratio: 3.5 / 2;
            overflow: hidden;
            border: 1px solid #dcdcdc;
            border-radius: 10px;
            background: #fff;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            display: flex;
        }
        .left {
            width: 33%;
            background: #f6f7f8;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
        }
        .left img {
            width: 78px;
            height: 78px;
            border-radius: 8px;
            object-fit: cover;
        }
        .placeholder {
            width: 78px;
            height: 78px;
            border-radius: 999px;
            background: #e8eaec;
            color: #888;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }
        .right {
            flex: 1;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .name {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.1;
            color: #111;
        }
        .title {
            font-size: 14px;
            font-weight: 600;
            color: #222;
        }
        .dept {
            font-size: 12px;
            color: #666;
        }
        .contact {
            margin-top: 6px;
            border-top: 1px solid #ececec;
            padding-top: 6px;
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
        .footer {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 8px;
        }
        .company {
            min-width: 0;
            font-size: 10px;
            color: #666;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .qr {
            width: 52px;
            height: 52px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="left">
            @if (!empty($employee->photo_url))
                <img src="{{ $employee->photo_url }}" alt="Photo">
            @else
                <div class="placeholder">?</div>
            @endif
        </div>
        <div class="right">
            <div class="name">{{ trim($employee->first_name.' '.$employee->last_name) }}</div>
            @if (!empty($employee->jobPosition?->name))
                <div class="title">{{ $employee->jobPosition->name }}</div>
            @endif
            @if (!empty($employee->department?->name))
                <div class="dept">{{ $employee->department->name }}</div>
            @endif
            <div class="contact">
                <div>{{ $employee->email_address }}</div>
                @if (!empty($employee->contact_number))
                    <div>{{ $employee->contact_number }}</div>
                @endif
            </div>
            <div class="footer">
                <div class="company">{{ $employee->companyProfile?->company_name ?? $appName }}</div>
                <img class="qr" src="{{ $qrCodeUrl }}" alt="QR">
            </div>
        </div>
    </div>
</body>
</html>

