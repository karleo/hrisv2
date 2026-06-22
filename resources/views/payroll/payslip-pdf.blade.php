<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Payslip — {{ $employeeName }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 14mm 16mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111;
            margin: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }

        h1 {
            font-size: 17px;
            margin: 0 0 3px;
        }

        .meta {
            font-size: 10px;
            color: #444;
            margin: 0;
            line-height: 1.5;
        }

        .logo {
            max-height: 40px;
            max-width: 120px;
        }

        .divider {
            border: none;
            border-top: 1.5px solid #222;
            margin: 10px 0 12px;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #555;
            margin: 0 0 5px;
        }

        .employee-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .employee-table td {
            padding: 3px 6px 3px 0;
            font-size: 10.5px;
        }

        .employee-table .label {
            color: #666;
            width: 35%;
        }

        .pay-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .pay-grid th {
            background: #f0f0f0;
            font-size: 10px;
            padding: 5px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        .pay-grid td {
            padding: 5px 8px;
            font-size: 10.5px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }

        .pay-grid .amount {
            text-align: right;
        }

        .pay-grid tfoot td {
            font-weight: bold;
            background: #f7f7f7;
            border-top: 1.5px solid #aaa;
        }

        .net-box {
            border: 2px solid #222;
            border-radius: 3px;
            padding: 10px 14px;
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
        }

        .net-box .net-label {
            font-size: 13px;
            font-weight: bold;
        }

        .net-box .net-amount {
            font-size: 15px;
            font-weight: bold;
        }

        .net-row {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #222;
            margin-top: 14px;
        }

        .net-row td {
            padding: 8px 12px;
            font-size: 13px;
            font-weight: bold;
        }

        .net-row .right {
            text-align: right;
        }

        .footer {
            margin-top: 20px;
            font-size: 9px;
            color: #888;
            text-align: center;
        }
    </style>
</head>
<body>

    {{-- Header --}}
    <table class="header-table">
        <tr>
            <td>
                <h1>Payslip</h1>
                <p class="meta">
                    <strong>{{ $companyName }}</strong><br>
                    Pay period: {{ $periodFrom }} to {{ $periodTo }}<br>
                    Generated: {{ $generatedAt }}
                </p>
            </td>
            <td style="text-align: right; width: 130px;">
                @if ($companyLogoDataUri !== null)
                    <img class="logo" src="{{ $companyLogoDataUri }}" alt="{{ $companyName }} logo">
                @endif
            </td>
        </tr>
    </table>

    <hr class="divider">

    {{-- Employee details --}}
    <p class="section-title">Employee</p>
    <table class="employee-table">
        <tr>
            <td class="label">Name</td>
            <td>{{ $employeeName }}</td>
            <td class="label">Pay period</td>
            <td>{{ $periodFrom }} — {{ $periodTo }}</td>
        </tr>
        @if ($employeeCode)
        <tr>
            <td class="label">Employee code</td>
            <td>{{ $employeeCode }}</td>
            <td class="label">Currency</td>
            <td>{{ $currency }}</td>
        </tr>
        @endif
        @if ($department)
        <tr>
            <td class="label">Department</td>
            <td colspan="3">{{ $department }}</td>
        </tr>
        @endif
    </table>

    {{-- Earnings --}}
    <p class="section-title">Earnings</p>
    <table class="pay-grid">
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount">Amount ({{ $currency }})</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basic salary</td>
                <td class="amount">{{ number_format($basicSalary, 2) }}</td>
            </tr>
            @if ($housingAllowance > 0)
            <tr>
                <td>Housing allowance</td>
                <td class="amount">{{ number_format($housingAllowance, 2) }}</td>
            </tr>
            @endif
            @if ($transportAllowance > 0)
            <tr>
                <td>Transport allowance</td>
                <td class="amount">{{ number_format($transportAllowance, 2) }}</td>
            </tr>
            @endif
            @if ($foodAllowance > 0)
            <tr>
                <td>Food allowance</td>
                <td class="amount">{{ number_format($foodAllowance, 2) }}</td>
            </tr>
            @endif
            @if ($otherAllowance > 0)
            <tr>
                <td>Other allowance</td>
                <td class="amount">{{ number_format($otherAllowance, 2) }}</td>
            </tr>
            @endif
            @if ($overtimeAmount > 0)
            <tr>
                <td>Overtime ({{ $overtimeHours }}h @ {{ $overtimeMultiplier }}x)</td>
                <td class="amount">{{ number_format($overtimeAmount, 2) }}</td>
            </tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td>Gross salary</td>
                <td class="amount">{{ number_format($grossSalary, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    {{-- Deductions --}}
    @if ($totalDeductions > 0)
    <p class="section-title">Deductions</p>
    <table class="pay-grid">
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount">Amount ({{ $currency }})</th>
            </tr>
        </thead>
        <tbody>
            @if ($loanDeduction > 0)
            <tr>
                <td>Loan deduction</td>
                <td class="amount">{{ number_format($loanDeduction, 2) }}</td>
            </tr>
            @endif
            @if ($otherDeduction > 0)
            <tr>
                <td>Other deduction</td>
                <td class="amount">{{ number_format($otherDeduction, 2) }}</td>
            </tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td>Total deductions</td>
                <td class="amount">{{ number_format($totalDeductions, 2) }}</td>
            </tr>
        </tfoot>
    </table>
    @endif

    {{-- Net pay --}}
    <table class="net-row">
        <tr>
            <td>Net Pay</td>
            <td class="right">{{ $currency }} {{ number_format($netSalary, 2) }}</td>
        </tr>
    </table>

    <p class="footer">This payslip was generated automatically by the HR system. For queries, contact HR.</p>

</body>
</html>
