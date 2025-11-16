from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

import os

# 确保数据目录存在
data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)

DATABASE_URL = f'sqlite+aiosqlite:///{os.path.join(data_dir, "db.sqlite")}'
engine = create_async_engine(DATABASE_URL, future=True, echo=True)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base(engine)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal.begin() as session:
        yield session
