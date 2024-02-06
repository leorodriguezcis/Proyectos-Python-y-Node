from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.bootstrap import init_routes
from src.settings.database import connect_database

app = FastAPI(
    title="POC GPT API",
    description="""
    """,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_routes(app)

connect_database()
