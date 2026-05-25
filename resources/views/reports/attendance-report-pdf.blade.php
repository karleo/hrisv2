<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Attendance report</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111;
        }
        .header {
            width: 100%;
            margin-bottom: 16px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        .header-title {
            width: 70%;
        }
        .header-logo {
            width: 30%;
            text-align: right;
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
        }
        table.data th, table.data td {
            border: 1px solid #ccc;
            padding: 6px 8px;
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
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="header-title">
                    <h1>Attendance report</h1>
                    <p class="meta">
                        <strong>{{ $companyName }}</strong><br>
                        Period: {{ $from }} to {{ $to }}<br>
                        @if ($employeeLabel !== null)
                            Employee: {{ $employeeLabel }}<br>
                        @endif
                        @if ($deviceLabel !== null)
                            Device: {{ $deviceLabel }}<br>
                        @endif
                        Generated: {{ $generatedAt }}
                    </p>
                </td>
                <td class="header-logo">
                    @if ($companyLogoDataUri !== null)
                        <img class="logo" src="{{ $companyLogoDataUri }}" alt="{{ $companyName }} logo">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    @if (count($rows) === 0)
        <p class="empty">No attendance records for the selected filters.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Employee code</th>
                    <th>Employee name</th>
                    <th>Clock in</th>
                    <th>Clock out</th>
                    <th>Working hours</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td>{{ $row['date'] }}</td>
                        <td>{{ $row['employee_code'] ?? '—' }}</td>
                        <td>{{ $row['employee_name'] }}</td>
                        <td>{{ $row['clock_in'] ?? '—' }}</td>
                        <td>{{ $row['clock_out'] ?? '—' }}</td>
                        <td>{{ $row['working_hours'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</body>
</html>
