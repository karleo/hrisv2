<?php

namespace App\Http\Middleware;

use App\Support\LocaleConfig;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class HandleLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = LocaleConfig::normalize(
            $request->cookie('locale') ?? $request->session()->get('locale')
        );

        App::setLocale($locale);

        $request->session()->put('locale', $locale);

        return $next($request);
    }
}
