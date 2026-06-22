<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Payroll register</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 12mm 10mm 14mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #111;
            margin: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }

        h1 {
            font-size: 16px;
            margin: 0 0 3px;
        }

        .meta {
            font-size: 9.5px;
            color: #444;
            margin: 0;
            line-height: 1.5;
        }

        .logo {
            max-height: 36px;
            max-width: 110px;
        }

        .divider {
            border: none;
            border-top: 1.5px solid #222;
            margin: 8px 0 10px;
        }

        .data {
            width: 100%;
            border-collapse: collapse;
        }

        .data th {
            background: #f0f0f0;
            font-size: 9px;
            padding: 4px 6px;
            text-align: right;
            border-bottom: 1px solid #ccc;
        }

        .data th.left {
            text-align: left;
        }

        .data td {
            padding: 4px 6px;
            font-size: 9.5px;
            text-align: right;
            border-bottom: 1px solid #eee;
        }

        .data td.left {
            text-align: left;
        }

        .data tfoot td {
            font-weight: bold;
            background: #f4f4f4;
            border-top: 1.5px solid #aaa;
        }

        .totals-row {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            border: 2px solid #222;
        }

        .totals-row td {
            padding: 7px 10px;
            font-size: 11px;
            font-weight: bold;
        }

        .totals-row .right {
            text-align: right;
        }

        .footer {
            margin-top: 14px;
            font-size: 8.5px;
            color: #888;
            text-align: center;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td>
                <h1>Payroll register</h1>
                <p class="meta">
                    <strong>{{ $companyName }}</strong><br>
                    Pay period: {{ $periodFrom }} to {{ $periodTo }}<br>
                    Generated: {{ $generatedAt }}
                </p>
            </td>
            <td style="text-align: right; width: 120px;">
                @if ($companyLogoDataUri !== null)
                    <img class="logo" src="{{ $companyLogoDataUri }}" alt="{{ $companyName }} logo">
                @endif
            </td>
        </tr>
    </table>

    <hr class="divider">

    <table class="data">
        <thead>
            <tr>
                <th class="left">#</th>
                <th class="left">Employee</th>
                <th class="left">Department</th>
                <th>Basic</th>
                <th>Housing</th>
                <th>Transport</th>
                <th>Food</th>
                <th>Other</th>
                <th>Overtime</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net pay ({{ $currency }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $i => $row)
            <tr>
                <td class="left">{{ $i + 1 }}</td>
                <td class="left">{{ $row['employee_name'] }}</td>
                <td class="left">{{ $row['department'] ?? '—' }}</td>
                <td>{{ number_format($row['basic_salary'], 2) }}</td>
                <td>{{ number_format($row['housing_allowance'], 2) }}</td>
                <td>{{ number_format($row['transport_allowance'], 2) }}</td>
                <td>{{ number_format($row['food_allowance'], 2) }}</td>
                <td>{{ number_format($row['other_allowance'], 2) }}</td>
                <td>{{ number_format($row['overtime_amount'], 2) }}</td>
                <td>{{ number_format($row['gross_salary'], 2) }}</td>
                <td>{{ number_format($row['total_deductions'], 2) }}</td>
                <td><strong>{{ number_format($row['net_salary'], 2) }}</strong></td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td class="left" colspan="9">Totals</td>
                <td>{{ number_format($totalGross, 2) }}</td>
                <td>{{ number_format($totalDeductions, 2) }}</td>
                <td>{{ number_format($totalNet, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <p class="footer">
        {{ $companyName }} &mdash; Payroll register &mdash; {{ $periodFrom }} to {{ $periodTo }} &mdash; Generated {{ $generatedAt }}
    </p>

</body>
</html>
