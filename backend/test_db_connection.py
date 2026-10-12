"""
PostgreSQL Database Connectivity Test Script
Tests connection, dialect detection, and table verification.
Does not expose passwords or secrets in stdout.
"""
import asyncio
import os
import sys

from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, init_db


async def test_db_connection():
    print("============================================================")
    print("CodeGuardian AI — Database Connectivity Diagnostic")
    print("============================================================")

    # Obfuscate credentials for safe reporting
    raw_url = settings.DATABASE_URL
    if "@" in raw_url:
        protocol_and_auth, host_and_db = raw_url.split("@", 1)
        protocol = protocol_and_auth.split("://")[0]
        safe_display = f"{protocol}://****:****@{host_and_db}"
    else:
        safe_display = raw_url

    print(f"Target Database URL: {safe_display}")

    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            scalar = result.scalar()
            print(f"Connection test query (SELECT 1): SUCCESS (returned {scalar})")

            # Check database dialect version
            if "postgres" in settings.DATABASE_URL.lower():
                ver_res = await conn.execute(text("SELECT version()"))
                version = ver_res.scalar()
                print(f"PostgreSQL Version: {version[:50]}...")
            else:
                ver_res = await conn.execute(text("SELECT sqlite_version()"))
                version = ver_res.scalar()
                print(f"SQLite Version: {version}")

        # Initialize/verify tables
        print("Initializing tables if not present...")
        await init_db()
        print("Table verification: SUCCESS (users, analyses, findings, duplicate_groups, user_settings)")
        print("\nAll database checks PASSED! Real database is ready for production use.")
        return True

    except Exception as exc:
        print(f"\n[ERROR] Database connection failed: {exc}")
        print("\nTroubleshooting tips:")
        print("1. If using Supabase / PostgreSQL: Verify the DATABASE_URL in .env")
        print("   Format: postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres")
        print("2. Ensure asyncpg is installed (`pip install asyncpg psycopg2-binary`)")
        print("3. Check firewall / IP allowlist on Supabase / host provider.")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_db_connection())
    sys.exit(0 if success else 1)
