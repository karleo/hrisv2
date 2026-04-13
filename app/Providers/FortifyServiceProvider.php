<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Contracts\FaceVerificationContract;
use App\Http\Responses\Fortify\LoginResponse as FortifyLoginResponse;
use App\Http\Responses\Fortify\TwoFactorLoginResponse as FortifyTwoFactorLoginResponse;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    private const FACE_ONLY_EMAIL_PLACEHOLDER = '__face_only_login__';

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponse::class, FortifyLoginResponse::class);
        $this->app->singleton(TwoFactorLoginResponse::class, FortifyTwoFactorLoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();

        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        Fortify::authenticateUsing(function (Request $request): ?User {
            $email = trim((string) $request->input('email', ''));
            $faceFile = $request->file('face_capture');
            $hasValidFaceFile = $faceFile !== null && $faceFile->isValid();
            $isFaceOnlyAttempt = $email === '' || $email === self::FACE_ONLY_EMAIL_PLACEHOLDER;

            if ($isFaceOnlyAttempt) {
                if (! $hasValidFaceFile) {
                    throw ValidationException::withMessages([
                        'face_capture' => __('Face verification is required.'),
                    ]);
                }

                $identifyRateKey = 'face-login:identify:'.$request->ip();
                if (RateLimiter::tooManyAttempts($identifyRateKey, 20)) {
                    throw ValidationException::withMessages([
                        'face_capture' => __('Too many face verification attempts. Try again later.'),
                    ]);
                }

                RateLimiter::hit($identifyRateKey, decaySeconds: 120);

                $verifier = app(FaceVerificationContract::class);
                $candidates = User::query()
                    ->where(function ($query) {
                        $query->whereNotNull('face_enrolled_at')
                            ->orWhereNotNull('face_reference_path')
                            ->orWhereNotNull('face_profile');
                    })
                    ->get();

                foreach ($candidates as $candidate) {
                    if (Schema::hasColumn('users', 'is_active') && ! $candidate->is_active) {
                        continue;
                    }

                    if ($verifier->verify($candidate, $faceFile)) {
                        RateLimiter::clear($identifyRateKey);

                        return $candidate;
                    }
                }

                throw ValidationException::withMessages([
                    'face_capture' => __('Face verification failed.'),
                ]);
            }

            $user = User::query()
                ->where('email', $email)
                ->first();

            if (! $user) {
                return null;
            }

            if (Schema::hasColumn('users', 'is_active') && ! $user->is_active) {
                throw ValidationException::withMessages([
                    'email' => 'Your account is inactive. Please contact HR.',
                ]);
            }

            $hasFaceEnrollment =
                $user->face_enrolled_at !== null ||
                (is_array($user->face_profile) && $user->face_profile !== []) ||
                (is_string($user->face_reference_path) && $user->face_reference_path !== '');

            if ($hasFaceEnrollment) {
                if (! $hasValidFaceFile) {
                    throw ValidationException::withMessages([
                        'face_capture' => __('Face verification is required.'),
                    ]);
                }

                $rateKey = 'face-login:'.$user->id.':'.$request->ip();
                if (RateLimiter::tooManyAttempts($rateKey, 20)) {
                    throw ValidationException::withMessages([
                        'email' => __('Too many face verification attempts. Try again later.'),
                    ]);
                }

                RateLimiter::hit($rateKey, decaySeconds: 120);

                $verified = app(FaceVerificationContract::class)->verify($user, $faceFile);

                if (! $verified) {
                    throw ValidationException::withMessages([
                        'face_capture' => __('Face verification failed.'),
                    ]);
                }

                RateLimiter::clear($rateKey);

                return $user;
            }

            if (! Hash::check((string) $request->input('password'), $user->password)) {
                return null;
            }

            return $user;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            if ($request->hasFile('face_capture')) {
                return Limit::perMinute(20)->by($throttleKey);
            }

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
