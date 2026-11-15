<?php

namespace Tests\Unit;

use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

class VercelRequestTest extends TestCase
{
    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function test_vercel_function_directory_does_not_strip_api_route_prefix(): void
    {
        foreach ([
            ['/api/health', 'GET'],
            ['/up', 'GET'],
            ['/api/student/payments?status=pending', 'POST'],
        ] as [$uri, $method]) {
            $original = Request::create('https://backend.example.test'.$uri, $method, server: [
                'SCRIPT_FILENAME' => '/var/task/user/api/index.php',
                'SCRIPT_NAME' => '/api/index.php',
                'PHP_SELF' => '/api/index.php',
                'HTTP_AUTHORIZATION' => 'Bearer deployment-test-token',
            ]);

            $_SERVER = $original->server->all();
            $_GET = $original->query->all();
            $_POST = [];

            require __DIR__.'/../../bootstrap/vercel.php';

            $request = Request::capture();

            $this->assertSame(parse_url($uri, PHP_URL_PATH), $request->getPathInfo());
            $this->assertSame('', $request->getBaseUrl());
            $this->assertSame($method, $request->getMethod());
            $this->assertSame('deployment-test-token', $request->bearerToken());
            $this->assertSame($original->query->all(), $request->query->all());
        }
    }
}
