
# Instructions for Gemini CLI — Fixes & Improvements (Auth, Backend, Resume Analysis, Celery removal, RabbitMQ handling)

**Purpose:**  
This file provides step-by-step instructions and code patches for the Gemini CLI to apply to the project. Goals are:

- Improve and harden authentication (JWT + refresh + cookie storage + CSRF safety).  
- Add a landing page that directs to the auth flow.  
- Keep existing functionality but make backend more robust.  
- Fix the crash when analyzing user-provided resume content.  
- Remove Celery (no persistent worker required) and replace with cost-free alternatives.  
- Improve RabbitMQ handling (connection resiliency, retries, and graceful fallback).

> Important: run these steps in a feature branch, back up the repo, and run tests. If you use the Gemini CLI to apply code changes, keep commits small and test after each logical change.

---

## 0. Pre-requisites
- Python 3.10+ and pip.
- Project virtualenv active.
- Access to repo and ability to run migrations.
- Gemini CLI installed and authorized to edit repo files.

---

## 1. Create a backup branch
Run:
```bash
git checkout -b fix/auth-resume-celery-rabbitmq
git push -u origin fix/auth-resume-celery-rabbitmq
```

---

## 2. Add a simple landing page that routes to auth (frontend)
If your frontend is Next.js (common in your projects), add a simple `/pages/index.js` (or `app/page.js` for App Router). Example minimal Next.js landing page:

```jsx
// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:20}}>
      <h1>Welcome to [Your App]</h1>
      <p>Sign in to continue.</p>
      <div style={{display:'flex',gap:12}}>
        <Link href="/auth/login"><a>Sign in</a></Link>
        <Link href="/auth/register"><a>Register</a></Link>
      </div>
    </main>
  );
}
```

If you use a Django-rendered frontend, add a simple template at `templates/index.html` and point `urls.py` root route to render it.

---

## 3. Authentication improvements (Django + GraphQL)
Your project uses `graphene-django` and `graphql_jwt`. Improve by:

1. Use refresh tokens (long-lived) + short-lived access tokens.
2. Store refresh token in a secure, HttpOnly, `SameSite=Lax` cookie.
3. Keep access token short-lived and return it in GraphQL responses.
4. Add standard login/logout mutations and a refresh mutation.

### settings.py
Add / update:
```py
# settings.py (relevant parts)
GRAPHENE = {
    "SCHEMA": "yourapp.schema.schema",
}

AUTHENTICATION_BACKENDS = [
    "graphql_jwt.backends.JSONWebTokenBackend",
    "django.contrib.auth.backends.ModelBackend",
]

GRAPHQL_JWT = {
    "JWT_ALLOW_ANY_HANDLER": "path.to.custom_allow_any",
    "JWT_VERIFY_EXPIRATION": True,
    "JWT_LONG_RUNNING_REFRESH_TOKEN": True,  # allow refresh tokens
    "JWT_REFRESH_EXPIRATION_DELTA": datetime.timedelta(days=7),
    "JWT_EXPIRATION_DELTA": datetime.timedelta(minutes=15),
}
```

### Mutations (example)
Create or update `accounts/mutations.py`:

```py
import graphene
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from graphql_jwt.shortcuts import get_token, create_refresh_token
from graphql_jwt.utils import jwt_encode
from django.conf import settings

class ObtainJSONWebTokenWithRefresh(graphene.Mutation):
    token = graphene.String()
    refresh_token = graphene.String()
    success = graphene.Boolean()

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    def mutate(self, info, username, password):
        user = authenticate(username=username, password=password)
        if user is None:
            return ObtainJSONWebTokenWithRefresh(success=False, token=None, refresh_token=None)
        # login in Django session for admin access compatibility
        django_login(info.context, user)
        token = get_token(user)
        refresh_token = create_refresh_token(user)
        # set refresh token cookie
        info.context.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            samesite="Lax",
            secure=not settings.DEBUG,
            max_age=7*24*3600,
        )
        return ObtainJSONWebTokenWithRefresh(success=True, token=token, refresh_token=refresh_token)
```

**Notes:** For GraphQL responses, do not put refresh token in the JSON body — set it as an HttpOnly cookie to avoid XSS leakage.

### Refresh mutation
Add a `RefreshToken` mutation that reads the cookie, validates, and returns a new access token. On logout, clear the cookie.

---

## 4. Secure token storage suggestions (frontend)
- Store access token in memory (React context) and not localStorage.
- Use refresh token via cookie to get new access tokens.
- On page load, call a `/api/auth/refresh` endpoint to exchange refresh cookie for access token.

Example (Next.js API route `/pages/api/auth/refresh.js`):
```js
export default async function handler(req, res) {
  const r = await fetch(process.env.BACKEND_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      query: `
        mutation { refreshToken { token } }
      `
    })
  });
  const json = await r.json();
  if (json?.data?.refreshToken?.token) {
    res.status(200).json({ token: json.data.refreshToken.token });
  } else {
    res.status(401).end();
  }
}
```

---

## 5. Remove Celery and replace with two alternatives (choose one)

### Option A — Immediate synchronous processing (no extra infra)
**Good**: cheapest, no worker.  
**Tradeoff**: request may block; UI must show progress or limit file sizes/time.

**Implementation:**
- Remove Celery imports, tasks, and `celery.py`.
- Replace `@shared_task` calls with local functions that run synchronously inside the request handler with a strict timeout.

Example (resume analysis view):
```py
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutTimeoutError
import signal

def analyze_resume_sync(text):
    # your existing resume-analysis logic moved here
    ...

def analyze_resume_view(request):
    text = request.POST.get("resume_text", "")[:20000]  # limit size
    with ThreadPoolExecutor(max_workers=2) as ex:
        future = ex.submit(analyze_resume_sync, text)
        try:
            result = future.result(timeout=12)  # 12s max
        except FutTimeoutError:
            future.cancel()
            return JsonResponse({"error":"processing_timeout"}, status=504)
        except Exception as e:
            # log and return safe message
            logger.exception("Resume analysis failed")
            return JsonResponse({"error":"analysis_failed"}, status=500)
    return JsonResponse({"ok": True, "result": result})
```

Add rate-limiting (DRF throttle or custom) and input-size limits to prevent abuse.

### Option B — Serverless function (recommended for heavier processing)
Use Vercel, Cloud Run, or AWS Lambda to perform resume analysis. The main app will call the serverless endpoint by passing the file or text. This avoids a persistent worker but may incur small per-op cost.

---

## 6. Fix "crash when analyzing user-provided resume info"
Common causes: unbounded input size, unhandled exceptions, missing MIME checks, model/API timeouts, or resource-intensive synchronous code.

**Steps:**
1. Add input validation:
   - Limit file size and text length (`max 20000 chars` recommended).
   - Detect MIME and allow only `.pdf`, `.docx`, `.txt` if you parse files.
2. Wrap analysis in try/except and return structured errors (status codes).
3. Add timeouts (ThreadPoolExecutor `.result(timeout=...)` or `requests` timeouts).
4. Sanitize text (strip binary, control chars).
5. Add logging and Sentry for error aggregation.

Example wrapper for GraphQL resolver:
```py
def resolve_analyze_resume(self, info, input_text):
    try:
        input_text = sanitize_input(input_text)[:20000]
        result = analyze_resume_sync(input_text)  # use method above
        return ResumeAnalysisResult(success=True, summary=result)
    except Exception as e:
        logger.exception("Resume analysis error")
        return ResumeAnalysisResult(success=False, error="analysis_failed")
```

---

## 7. Remove Celery-specific config & docker-compose changes
- Remove `celery.py`, `tasks.py` usage, and stop starting celery worker containers in CI/docker-compose.
- In `docker-compose.yml` remove `worker` service for Celery.
- If using environment variables like `CELERY_BROKER_URL`, remove or ignore them.

---

## 8. Improve RabbitMQ handling (if you still use it)
If RabbitMQ is still used (for message passing between services), make the client code resilient:

- Use connection retry with exponential backoff.
- Use `pika` with `BlockingConnection` and a reconnect loop.
- Catch `AMQPConnectionError` and attempt reconnects up to N times.
- Implement graceful shutdown and requeueing.

Example minimal resilient connection:
```py
import pika, time
from pika.exceptions import AMQPConnectionError

def connect_rabbitmq(url):
    retries = 0
    while retries < 6:
        try:
            params = pika.URLParameters(url)
            conn = pika.BlockingConnection(params)
            return conn
        except AMQPConnectionError:
            backoff = min(30, 2 ** retries)
            time.sleep(backoff)
            retries += 1
    raise RuntimeError("Could not connect to RabbitMQ")
```

If you cannot reliably run consumers (workers) because of budget, avoid using RabbitMQ for critical single-instance tasks — prefer HTTP or serverless calls.

---

## 9. Database / Migrations
- Run migrations after changes:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 10. Tests & Local verification
- Add quick unit tests for:
  - Auth flows (login/refresh/logout).
  - Resume analysis endpoint for good input, large input, and malicious input.
- Run tests:
```bash
pytest
```

---

## 11. Logging, Monitoring, and Alerts
- Add structured logging around sensitive areas (auth, resume analysis, external API calls).
- If possible, add Sentry or similar (free tier) for crash aggregation.

---

## 12. Gemini CLI-specific hints (how to instruct gemini to modify files)
- Create commits per feature:
  - `git commit -m "feat(auth): add refresh token cookie and refresh mutation"`
  - `git commit -m "fix(resume): sync analysis with timeout + input validation"`
  - `git commit -m "chore: remove celery config & docker-compose worker"`
  - `git commit -m "chore(rabbitmq): add robust connect helper with retries"`
- For edits, target files:
  - `accounts/mutations.py`
  - `accounts/schema.py`
  - `project/settings.py`
  - `resume/analysis.py` (or wherever resume logic lives)
  - `docker-compose.yml`
  - `celery.py` (delete)
  - `requirements.txt` (remove celery; add `futures` if needed)
- After each edit, run unit tests and run `python manage.py runserver` to verify.

---

## 13. Quick checklist for Gemini to follow (copyable)
1. Backup branch created.
2. Add landing page file in frontend.
3. Implement auth improvements (mutations, settings).
4. Implement refresh token cookie flow.
5. Replace Celery tasks with synchronous ThreadPoolExecutor wrappers OR configure serverless function endpoint and call it.
6. Delete Celery config and references.
7. Improve RabbitMQ connection code with retry/backoff.
8. Add input validation & timeouts in resume analysis handlers.
9. Add logging and basic tests.
10. Run migrations and tests; commit and push.

---

## 14. Example `requirements.txt` changes
Remove:
```
celery
```
Add if using thread-timeout helpers:
```
futures
python-magic   # if you check file types
pika           # if you still connect to RabbitMQ
```

---

## 15. Rollback plan
If anything fails, revert:
```bash
git checkout main
git reset --hard origin/main
```
Then open a PR with the changes, include test results and a short runbook.

---

## 16. Notes & Tradeoffs
- Removing Celery means you lose distributed task processing. For light resume-analysis loads, synchronous processing is acceptable. For high volume, use serverless or a paid worker.
- Storing refresh tokens as cookies improves XSS protection but requires CSRF protections on endpoints that use cookies.
- Limit resume text size and runtime to avoid DoS.

---

If you want, I can also:
- Produce concrete patch diffs for each file (git patch style).
- Generate a ready-to-download `.md` file (this file is saved already).

