<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function header(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'unread_count' => 0,
                'items' => [],
            ]);
        }

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $user
                ->notifications()
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($notification) => [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ]),
        ]);
    }

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

    public function destroyAll(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user === null) {
            abort(403);
        }

        $user->notifications()->delete();

        return back();
    }
}
