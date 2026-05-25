<?php

namespace App\Http\Controllers\Biometric;

use App\Http\Controllers\Controller;
use App\Services\Biometric\IclockAdmsHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class IclockAdmsController extends Controller
{
    public function cdata(Request $request, IclockAdmsHandler $handler): Response
    {
        $body = $request->isMethod('POST')
            ? $handler->handlePost($request)
            : $handler->handleGet($request);

        return response($body, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }

    public function getRequest(Request $request, IclockAdmsHandler $handler): Response
    {
        return response($handler->handleGetRequest($request), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }

    public function deviceCmd(Request $request, IclockAdmsHandler $handler): Response
    {
        return response($handler->handleDeviceCmd($request), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }
}
