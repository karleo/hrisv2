<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>IT asset inventory report</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 14mm 12mm 16mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #111;
            margin: 0;
        }

        table.report-page {
            width: 100%;
            border-collapse: collapse;
            page-break-after: always;
            page-break-inside: avoid;
        }

        table.report-page:last-child {
            page-break-after: avoid;
        }

        .report-page-content {
            vertical-align: top;
        }

        .report-page-footer {
            vertical-align: bottom;
            height: 10mm;
            text-align: center;
            font-size: 10px;
            color: #444;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }

        h1 {
            font-size: 18px;
            margin: 0 0 4px;
        }

        .meta {
            margin: 0;
            color: #444;
            line-height: 1.5;
        }

        .logo {
            max-width: 180px;
            max-height: 72px;
        }

        table.data {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
        }

        table.data th, table.data td {
            border: 1px solid #ccc;
            padding: 5px 6px;
            text-align: left;
        }

        table.data th {
            background: #f3f4f6;
            font-weight: bold;
        }

        table.data tr:nth-child(even) td {
            background: #fafafa;
        }

        .empty {
            padding: 12px 0;
            color: #666;
        }
    </style>
</head>
<body>
    @foreach ($pages as $pageIndex => $pageRows)
        @php($pageNumber = $pageIndex + 1)
        <table class="report-page">
            <tr>
                <td class="report-page-content">
                    @if ($pageIndex === 0)
                        <table class="header-table">
                            <tr>
                                <td style="width: 70%;">
                                    <h1>IT asset inventory</h1>
                                    <p class="meta">
                                        @if ($from && $to)
                                            Period: {{ $from }} – {{ $to }}<br>
                                        @else
                                            All registered assets<br>
                                        @endif
                                        @if ($categoryLabel)
                                            Category: {{ $categoryLabel }}<br>
                                        @endif
                                        @if ($hardwareLabel)
                                            Device type: {{ $hardwareLabel }}<br>
                                        @endif
                                        @if ($employeeLabel)
                                            Employee: {{ $employeeLabel }}<br>
                                        @endif
                                        Total assets: {{ $totalAssets }}
                                        @if ($totalValue)
                                            · Total value: {{ $totalValue }}
                                        @endif
                                        <br>
                                        Generated: {{ $generatedAt }}
                                    </p>
                                </td>
                                <td style="width: 30%; text-align: right;">
                                    @if ($companyLogoDataUri)
                                        <img src="{{ $companyLogoDataUri }}" alt="Logo" class="logo">
                                    @endif
                                    <p class="meta" style="margin-top: 8px;">{{ $companyName }}</p>
                                </td>
                            </tr>
                        </table>
                    @endif

                    @if (count($pageRows) === 0)
                        <p class="empty">No assets match the selected filters.</p>
                    @else
                        <table class="data">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Code</th>
                                    <th>Category</th>
                                    <th>Label</th>
                                    <th>Device type</th>
                                    <th>Serial / license</th>
                                    <th>Status</th>
                                    <th>Employee</th>
                                    <th>Purchase</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($pageRows as $row)
                                    <tr>
                                        <td>{{ $row['series_number'] }}</td>
                                        <td>{{ $row['code'] }}</td>
                                        <td>{{ $row['category'] }}</td>
                                        <td>{{ $row['label'] }}</td>
                                        <td>{{ $row['device_type'] }}</td>
                                        <td>{{ $row['identifier'] }}</td>
                                        <td>{{ $row['status'] }}</td>
                                        <td>{{ $row['employee_name'] }}</td>
                                        <td>{{ $row['purchase_date'] }}</td>
                                        <td>{{ $row['asset_value_display'] }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="report-page-footer">
                    Page {{ $pageNumber }} of {{ $totalPages }}
                </td>
            </tr>
        </table>
    @endforeach
</body>
</html>
