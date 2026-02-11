from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection
from app.database_indexes import create_indexes
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.posts.router import router as posts_router
from app.comments.router import router as comments_router
from app.messages.router import router as messages_router
from app.notifications.router import router as notifications_router
from app.stories.router import router as stories_router
from app.hashtags.router import router as hashtags_router
from app.moderation.router import router as moderation_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await create_indexes()  # Create database indexes
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Vois Social Media API",
    description="FastAPI + MongoDB Backend for Vois Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(messages_router)
app.include_router(notifications_router)
app.include_router(stories_router)
app.include_router(hashtags_router)
app.include_router(moderation_router)

@app.get("/")
async def root():
    return {"message": "Vois Social Media API with MongoDB", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)