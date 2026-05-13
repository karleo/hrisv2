
HRIS System build by Prime Team

<img width="1073" height="677" alt="image" src="https://github.com/user-attachments/assets/a98b4e34-d8ef-4439-a3d4-becb5546394f" />


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

For your project specifically, also ensure:

PHP is 8.3+ (your earlier test run failed on 8.2.12)
Queue worker if features depend on jobs: php artisan queue:work