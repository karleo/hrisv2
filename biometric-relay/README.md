# Biometric Relay

Standalone office worker: pull punches from a LAN ZKTeco device and POST ATTLOG to AWS HRIS `/iclock/cdata`.

See [deploy/README.md](deploy/README.md) for Windows Task Scheduler setup.

```powershell
composer install
copy .env.example .env
php artisan key:generate
php artisan relay:run
```
