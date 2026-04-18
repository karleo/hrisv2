<?php

namespace App\Http\Controllers;

use App\Support\LocaleConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(LocaleConfig::supported())],
        ]);

        $locale = LocaleConfig::normalize($validated['locale']);

        App::setLocale($locale);
        $request->session()->put('locale', $locale);
        Cookie::queue(cookie('locale', $locale, 60 * 24 * 365));

        return back();
    }
}
