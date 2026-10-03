<?php

return [

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'blockchain' => [
        'url' => env('PYTHON_BLOCKCHAIN_API_URL', 'http://localhost:8001'),
        'key' => env('PYTHON_BLOCKCHAIN_SERVICE_KEY', 'ssc-internal-service-secret-2026'),
        'network' => env('BLOCKCHAIN_NETWORK', 'sepolia'),
        'contract_address' => env('BLOCKCHAIN_CONTRACT_ADDRESS', '0x4a2f3977cd48FF6D04B0069d58dCAfd45e852856'),
        'rpc_url' => env('BLOCKCHAIN_RPC_URL', 'https://eth-sepolia.g.alchemy.com/v2/alch_bm-emTDc_mM27orkLHtLa'),
    ],

];

