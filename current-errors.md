# Server logs
==> Running 'gunicorn resumeforge_backend.wsgi:application --bind 0.0.0.0:$PORT'
[2025-10-06 05:22:04 +0000] [59] [INFO] Starting gunicorn 23.0.0
[2025-10-06 05:22:04 +0000] [59] [INFO] Listening at: http://0.0.0.0:10000 (59)
[2025-10-06 05:22:04 +0000] [59] [INFO] Using worker: sync
[2025-10-06 05:22:04 +0000] [61] [INFO] Booting worker with pid: 61
Not Found: /
127.0.0.1 - - [06/Oct/2025:05:22:06 +0000] "HEAD / HTTP/1.1" 404 2881 "-" "Go-http-client/1.1"
==> Your service is live 🎉
==> 
==> ///////////////////////////////////////////////////////////
==> 
==> Available at your primary URL https://resumeforgeai-zawv.onrender.com
==> 
==> ///////////////////////////////////////////////////////////
Not Found: /
127.0.0.1 - - [06/Oct/2025:05:22:08 +0000] "GET / HTTP/1.1" 404 2881 "-" "Go-http-client/2.0"
127.0.0.1 - - [06/Oct/2025:05:22:33 +0000] "POST /graphql HTTP/1.1" 200 154 "https://resume-forge-ai-woad.vercel.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"

# console errors

{
    "errors": [
        {
            "message": "No installed app with label 'refresh_token'.",
            "locations": [
                {
                    "line": 2,
                    "column": 3
                }
            ],
            "path": [
                "tokenAuth"
            ]
        }
    ],
    "data": {
        "tokenAuth": null
    }
}