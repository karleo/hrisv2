# Office biometric relay — Windows setup

Lightweight console app. Deploy **only** this folder (+ Composer deps), not the full HRIS.

## Requirements

- Windows PC on the **same LAN** as the biometric device
- PHP 8.2+ with `curl`, `openssl`, `mbstring`, `dom`, `json`
- Outbound HTTP to AWS (`/iclock/cdata` and `/api/biometric/relay/*`)

## Install

```powershell
cd C:\path\to\biometric-relay
composer install --no-dev
copy .env.example .env
php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
# paste into APP_KEY=base64:...
```

Edit `.env`:

- `RELAY_DEVICE_HOST` — device LAN IP
- `RELAY_DEVICE_SERIAL` — must match HRIS device serial
- `RELAY_DEVICE_WEB_USERNAME` / `RELAY_DEVICE_WEB_PASSWORD`
- `RELAY_CDATA_URL` — e.g. `http://hris-stag.primelogistics.ae/iclock/cdata`
- `RELAY_TOKEN` — same value as AWS `BIOMETRIC_RELAY_TOKEN`

## Manual run

```powershell
php artisan relay:run
```

## Task Scheduler (every 2 minutes)

Run PowerShell **as Administrator**:

```powershell
.\deploy\register-task.ps1 -RelayPath "C:\path\to\biometric-relay" -PhpPath "C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe"
```

Or create the task manually:

- Program: `php.exe`
- Arguments: `artisan relay:run`
- Start in: relay folder
- Trigger: every 2 minutes
- Run whether user is logged on or not

## Optional NSSM service

```powershell
nssm install BiometricRelay "C:\path\to\php.exe" "C:\path\to\biometric-relay\artisan" "relay:run"
# Prefer Task Scheduler for --once semantics; for a loop you'd add a daemon mode later.
```

## State files

| File | Purpose |
|------|---------|
| `storage/relay/state.json` | Watermark + last run summary |
| `storage/relay/pending.json` | Failed uploads awaiting retry |
| `storage/logs/relay.log` | Structured run logs |

AWS remains the source of truth for punches (`/iclock/cdata`).
