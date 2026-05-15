
HRIS System build by Prime Team

<img width="1073" height="677" alt="image" src="https://github.com/user-attachments/assets/a98b4e34-d8ef-4439-a3d4-becb5546394f" />




****chat****

Install dependencies (first time):

composer install
npm install
Run app for development (recommended):

composer run dev
(this typically runs Laravel server, queue, logs, and Vite together)
Or run separately:

Backend: php artisan serve
Frontend dev: npm run dev
Production assets build:

npm run build
Useful extras:

DB migrate/seed: php artisan migrate --seed
Clear caches (if needed): php artisan optimize:clear

Demo / form test data (employees, hardware inventory, document types, timetables):

php artisan db:seed

Re-run only demo rows (safe to repeat; uses updateOrCreate):

php artisan db:seed --class=DemoEmployeeSeeder
php artisan db:seed --class=HardwareAssetValueSeeder
php artisan db:seed --class=DocumentTypeSeeder
php artisan db:seed --class=LeaveRequestSeeder

Login users: test@example.com / chat@example.com (password: password). Demo employees use codes EMP-DEMO-001 … EMP-DEMO-012. Leave requests use codes LV-DEMO-001 … LV-DEMO-018 (draft, submitted, approved, rejected). Twenty **approved** leaves for **tomorrow** are seeded as `LV-TMR-01` … `LV-TMR-20`.
For your project specifically, also ensure:

PHP is 8.3+ (your earlier test run failed on 8.2.12)
Queue worker if features depend on jobs: php artisan queue:work

Employee presence (online / offline in Messages):

- Heartbeat writes cache keys `employee_app_active_v1_{employeeId}` (Unix timestamp of last ping; TTL 90s). Inspect with `php artisan tinker` or Redis CLI (`KEYS *employee_app_active*`).
- In the browser, `POST /employee-presence/heartbeat` should return **302** (Inertia) or **200** (JSON), never **419** (CSRF). If you see 419, clear caches and retry: `php artisan optimize:clear`.
- For **multiple PHP workers or servers**, use **`CACHE_STORE=redis`** (or another shared cache). The `file` driver is per-machine and can miss heartbeats written by another worker.
- Logout clears the presence cache server-side and the client leaves the `employees.online` Echo channel so peers see **Offline** immediately (HTTP + Reverb).
- On **login**, any stale presence entry for that user is cleared so they are **not** shown as online until the next heartbeat runs.
