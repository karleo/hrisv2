<?php

namespace App\Http\Responses\Fortify;

use App\Support\FortifyPostAuthenticationRedirect;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * @param  \Illuminate\Http\Request  $request
     */
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended(FortifyPostAuthenticationRedirect::path($request));
    }
}
