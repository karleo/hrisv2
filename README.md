# HRIS v2

HRIS system built by Prime Team.

<img width="1073" height="677" alt="image" src="https://github.com/user-attachments/assets/a98b4e34-d8ef-4439-a3d4-becb5546394f" />

## Requirements

| Tool | Version |
|------|---------|
| **PHP** | **8.3+** recommended (`composer.json` allows `^8.2`; use 8.3+ for Vite/Wayfinder on Windows/Laragon) |
| **Composer** | 2.x |
| **Node.js** | **20+** or **22+** (LTS recommended) |
| **npm** | 10+ |
| **Database** | SQLite (default) or MySQL/MariaDB |

### Optional (for full features)

- **Redis** — recommended when running multiple PHP workers (`CACHE_STORE=redis`)
- **Laravel Reverb** — real-time chat and employee presence (see `.env`)
- **Queue worker** — biometric sync and background jobs (`QUEUE_CONNECTION=database` by default)

### PHP extensions (enable in Laragon → PHP → Extensions)

Enable these for **both Apache and CLI** (Artisan, queue worker, and `composer run dev` use CLI PHP).

**Required (Laravel + this app)**

| Extension | Laragon name | Why |
|-----------|--------------|-----|
| `bcmath` | bcmath | Laravel |
| `ctype` | ctype | Laravel |
| `curl` | curl | HTTP clients (AWS, biometric web reports) |
| `dom` | dom | XML/HTML (DomPDF, exports) |
| `fileinfo` | fileinfo | File uploads and MIME detection |
| `gd` | gd | Face login enrollment, image handling |
| `json` | json | Laravel |
| `mbstring` | mbstring | Laravel |
| `openssl` | openssl | HTTPS, encryption |
| `pdo` | pdo | Database |
| `sockets` | sockets | Biometric ZKTeco TCP sync (**required for device pull**) |
| `tokenizer` | tokenizer | Laravel |
| `xml` | xml | Laravel |

**Database (enable one set)**

| Extension | When |
|-----------|------|
| `pdo_sqlite`, `sqlite3` | Default setup (SQLite) |
| `pdo_mysql`, `mysqli` | MySQL/MariaDB |

**Recommended**

| Extension | When |
|-----------|------|
| `intl` | Locales and formatting |
| `zip` | Excel import/export |
| `redis` | If `CACHE_STORE=redis` or `REDIS_CLIENT=phpredis` |

Check loaded extensions:

```bash
php -m
```

On Laragon, if biometrics fail with “ext-sockets not enabled”, enable **sockets** for CLI PHP too, then restart Apache and any open terminals.

## Tech stack

Laravel 12, Inertia v2, React 19, Tailwind CSS v4, Fortify, Reverb, Wayfinder

## First-time setup

```bash
# 1. Install dependencies
composer install
npm install

# 2. Environment
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate

# 3. Database (SQLite is the default)
# Windows: type nul > database\database.sqlite
# Linux/Mac: touch database/database.sqlite
php artisan migrate --seed

# 4. Public uploads (local disk)
php artisan storage:maintain

# 5. Build frontend assets (required before first visit if not using Vite dev server)
npm run build
```

Or use the built-in setup script:

```bash
composer run setup
```

## Running the app

### Development (recommended)

Starts Laravel server, queue worker, logs (Pail), and Vite together:

```bash
composer run dev
```

- App: `http://localhost:8000`
- Reverb (WebSockets): `http://127.0.0.1:8080` (configured in `.env`)

### Run separately

```bash
# Backend
php artisan serve

# Frontend (hot reload)
npm run dev

# Queue (biometrics, background jobs)
php artisan queue:work
# or
php artisan queue:listen
```

### Production / after pulling frontend changes

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Compile assets to `public/build` |
| `npm run lint` | ESLint |
| `vendor/bin/pint` | PHP code style |
| `php artisan migrate --seed` | Migrate and seed database |
| `php artisan db:seed` | Seed only |
| `php artisan optimize:clear` | Clear config, route, view, and cache |
| `php artisan storage:maintain` | Local: create `public/storage` symlink; S3: verify bucket access |
| `php artisan test` | Run PHPUnit tests |

## File storage (local disk vs AWS S3)

Uploads (signatures, photos, documents) use the `public` disk. How they are stored and served depends on `FILESYSTEM_DISK` in `.env`.

### Local disk (default)

```env
FILESYSTEM_DISK=local
```

Files are saved under `storage/app/public` and must be exposed through a symlink:

```bash
php artisan storage:maintain
```

That creates `public/storage` → `storage/app/public` so URLs like `/storage/employees/...` work. Run this after every deploy. If `public/storage` already exists as a regular folder, use:

```bash
php artisan storage:maintain --force
```

On Windows, enable **Developer Mode** or run the terminal as Administrator if symlink creation fails.

### AWS S3

```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-bucket
AWS_URL=https://your-bucket.s3.amazonaws.com
```

No `public/storage` symlink is required on the server. Verify credentials and bucket access with:

```bash
php artisan storage:maintain
```

The IAM user needs `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on the bucket. Set `AWS_URL` to the bucket or CloudFront URL if files must be reachable in the browser.

## Demo data and logins

```bash
php artisan db:seed
```

Re-run only demo rows (safe to repeat; uses `updateOrCreate`):

```bash
php artisan db:seed --class=DemoEmployeeSeeder
php artisan db:seed --class=HardwareAssetValueSeeder
php artisan db:seed --class=DocumentTypeSeeder
php artisan db:seed --class=LeaveRequestSeeder
```

| Email | Password |
|-------|----------|
| `test@example.com` | `password` |
| `chat@example.com` | `password` |

- Demo employees: `EMP-DEMO-001` … `EMP-DEMO-012`
- Leave requests: `LV-DEMO-001` … `LV-DEMO-018` (draft, submitted, approved, rejected)
- Twenty **approved** leaves for **tomorrow**: `LV-TMR-01` … `LV-TMR-20`

## Windows / Laragon notes

If `php` on PATH is older than 8.3, set in `.env`:

```env
WAYFINDER_PHP=C:/laragon/bin/php/php-8.3.30-Win32-vs16-x64/php.exe
```

For biometric device push from LAN devices, set your PC IP (not `localhost`):

```env
BIOMETRIC_PUSH_BASE_URL=http://192.168.1.88:8000
```

Biometric sync uses the queue worker. With `composer run dev`, the queue listener starts automatically; otherwise run `php artisan queue:work`.

## Employee presence (online / offline in Messages)

- Heartbeat writes cache keys `employee_app_active_v1_{employeeId}` (Unix timestamp of last ping; TTL 90s). Inspect with `php artisan tinker` or Redis CLI (`KEYS *employee_app_active*`).
- In the browser, `POST /employee-presence/heartbeat` should return **302** (Inertia) or **200** (JSON), never **419** (CSRF). If you see 419, clear caches and retry: `php artisan optimize:clear`.
- For **multiple PHP workers or servers**, use **`CACHE_STORE=redis`** (or another shared cache). The `file` driver is per-machine and can miss heartbeats written by another worker.
- Logout clears the presence cache server-side and the client leaves the `employees.online` Echo channel so peers see **Offline** immediately (HTTP + Reverb).
- On **login**, any stale presence entry for that user is cleared so they are **not** shown as online until the next heartbeat runs.
