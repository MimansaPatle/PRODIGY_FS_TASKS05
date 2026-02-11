from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    mongodb.client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    mongodb.database = mongodb.client[os.getenv("DATABASE_NAME", "social_app")]
    
    # Create indexes for better performance
    await create_indexes()
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        print("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for optimal performance"""
    db = mongodb.database
    
    # Users collection indexes
    await db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("username", ASCENDING)], unique=True),
        IndexModel([("followers_count", DESCENDING)]),
        IndexModel([("created_at", DESCENDING)])
    ])
    
    # Posts collection indexes
    await db.posts.create_indexes([
        IndexModel([("author_id", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("likes_count", DESCENDING)]),
        IndexModel([("tags", ASCENDING)])
    ])
    
    # Comments collection indexes
    await db.comments.create_indexes([
        IndexModel([("post_id", ASCENDING)]),
        IndexModel([("author_id", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)])
    ])
    
    # Likes collection indexes
    await db.likes.create_indexes([
        IndexModel([("post_id", ASCENDING)]),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)], unique=True)
    ])
    
    # Follows collection indexes
    await db.follows.create_indexes([
        IndexModel([("follower_id", ASCENDING)]),
        IndexModel([("following_id", ASCENDING)]),
        IndexModel([("follower_id", ASCENDING), ("following_id", ASCENDING)], unique=True)
    ])

def get_database():
    """Get database instance"""
    return mongodb.database