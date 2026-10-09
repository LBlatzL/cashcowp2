from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.auth import router as auth
from app.routers.atm import router as atm
from app.routers.servicecall import router as service
from app.routers.technician import router as technician
from app.routers.health import router as health
from mangum import Mangum
import os

app = FastAPI()

origin = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    origin.append(frontend_url.rstrip("/"))

app.include_router(auth)
app.include_router(atm)
app.include_router(service)
app.include_router(technician)
app.include_router(health)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

handler = Mangum(app)

@app.get("/")
async def main():
    return {"message": "Hello cash cow"}