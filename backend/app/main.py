from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.models.analysis import Analysis, Finding
from app.models.user import User
from app.security.auth import get_password_hash


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables
    await init_db()

    # Seed demo user & analyses if DB is empty
    async with AsyncSessionLocal() as session:
        from sqlalchemy import func, select
        result = await session.execute(select(func.count(User.id)))
        user_count = result.scalar()
        if user_count == 0:
            demo_user = User(
                id="demo-user-0001",
                email="developer@codeguardian.ai",
                hashed_password=get_password_hash("guardian123"),
                full_name="Alex Mercer",
                role="Senior Security Engineer",
            )
            session.add(demo_user)

            # Seed a sample Python analysis
            demo_analysis = Analysis(
                id="demo-analysis-0001",
                user_id="demo-user-0001",
                title="Python API Authentication Service",
                language="python",
                code="""import os\nimport sqlite3\n\ndef authenticate_user(username, password):\n    conn = sqlite3.connect('users.db')\n    cursor = conn.cursor()\n    # Insecure query with string formatting\n    query = f"SELECT * FROM accounts WHERE user = '{username}' AND pass = '{password}'"\n    cursor.execute(query)\n    return cursor.fetchone()\n""",
                quality_score=45.0,
                risk_score=55.0,
                findings_count=2,
                critical_count=1,
                high_count=0,
                medium_count=1,
                low_count=0,
                duration_ms=420,
                status="completed",
            )
            session.add(demo_analysis)

            f1 = Finding(
                id="demo-finding-0001",
                analysis_id="demo-analysis-0001",
                title="SQL Injection via String Formatting in Query",
                severity="Critical",
                category="Security",
                line_start=8,
                line_end=9,
                col_start=1,
                col_end=1,
                snippet="query = f\"SELECT * FROM accounts WHERE user = '{username}' AND pass = '{password}'\"",
                explanation="Query string is constructed using dynamic f-string formatting instead of parameterized placeholders (CWE-89).",
                impact="Attackers can bypass authentication with `' OR '1'='1` or dump database tables.",
                recommended_fix="Use parameterized queries: `cursor.execute('SELECT * FROM accounts WHERE user = ? AND pass = ?', (username, password))`",
                confidence="High",
                detection_method="Polyglot Security Rule",
                rule_id="PY-SQLI-CWE89",
                suggested_patch="cursor.execute('SELECT * FROM accounts WHERE user = ? AND pass = ?', (username, password))",
            )
            session.add(f1)

            f2 = Finding(
                id="demo-finding-0002",
                analysis_id="demo-analysis-0001",
                title="Unclosed Database Connection Resource Leak",
                severity="Medium",
                category="Bug",
                line_start=5,
                line_end=10,
                col_start=1,
                col_end=1,
                snippet="conn = sqlite3.connect('users.db')",
                explanation="Database connection opened without `with` context manager or explicit close() call in finally block (CWE-775).",
                impact="Resource exhaustion and SQLite file lock deadlocks under high request concurrency.",
                recommended_fix="Use `with sqlite3.connect('users.db') as conn:` context manager.",
                confidence="High",
                detection_method="Polyglot Quality Rule",
                rule_id="PY-RESOURCE-LEAK",
                suggested_patch="with sqlite3.connect('users.db') as conn:\n    cursor = conn.cursor()\n    ...",
            )
            session.add(f2)

            await session.commit()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI code reviewer and bug prediction engine.",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def check_payload_size(request: Request, call_next):
    # Enforce 2MB request body safety limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 2 * 1024 * 1024:
        return JSONResponse(status_code=413, content={"detail": "Payload exceeds 2MB limit."})
    return await call_next(request)


# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health",
    }
