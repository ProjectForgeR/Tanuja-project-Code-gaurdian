from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Normalize database URL for async driver if needed
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

is_sqlite = "sqlite" in db_url

connect_args = {"check_same_thread": False} if is_sqlite else {}
engine_kwargs = {
    "echo": False,
    "future": True,
    "connect_args": connect_args,
}

if not is_sqlite:
    # Production-ready PostgreSQL connection pool
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })

# Create async engine
engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        # Import models to register metadata
        from app.models.user import User  # noqa
        from app.models.analysis import Analysis, Finding, DuplicateGroup  # noqa
        from app.models.settings import UserSettings  # noqa
        
        await conn.run_sync(Base.metadata.create_all)
