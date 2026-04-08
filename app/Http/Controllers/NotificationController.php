<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markAsRead(Request $request, string $notification): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $target = $user->notifications()->whereKey($notification)->first();
        if ($target === null) {
            abort(404);
        }

        if ($target->read_at === null) {
            $target->markAsRead();
        }

        return back();
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $target = $user->notifications()->whereKey($notification)->first();
        if ($target === null) {
            abort(404);
        }

        $target->delete();

        return back();
    }
}

