import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres@localhost:5432/cashcow"
)

#DATABASE_URL = "postgresql+asyncpg://postgres:luke123@localhost:5432/cashcow"

engine = create_async_engine(DATABASE_URL, echo = True)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit = False)