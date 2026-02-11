"""
Database indexes for optimal query performance
"""
from app.database import get_database

async def create_indexes():
    """Create database indexes for optimal performance"""
    db = get_database()
    
    # Posts collection indexes
    await db.posts.create_index([("created_at", -1)])
    await db.posts.create_index([("likes_count", -1)])
    await db.posts.create_index([("comments_count", -1)])
    await db.posts.create_index([("views_count", -1)])  # New index for views
    await db.posts.create_index([("media_type", 1), ("created_at", -1)])
    await db.posts.create_index([("author_id", 1), ("created_at", -1)])
    
    # Post views collection indexes
    await db.post_views.create_index([("post_id", 1), ("viewer_id", 1)], unique=True)
    await db.post_views.create_index([("post_id", 1), ("viewed_at", -1)])
    
    # Likes collection indexes
    await db.likes.create_index([("post_id", 1), ("user_id", 1)], unique=True)
    await db.likes.create_index([("user_id", 1)])
    
    # Comments collection indexes
    await db.comments.create_index([("post_id", 1), ("created_at", 1)])
    await db.comments.create_index([("author_id", 1)])
    
    # Follows collection indexes
    await db.follows.create_index([("follower_id", 1), ("following_id", 1)], unique=True)
    await db.follows.create_index([("following_id", 1)])
    
    # Users collection indexes
    await db.users.create_index([("username", 1)], unique=True)
    await db.users.create_index([("email", 1)], unique=True)
    await db.users.create_index([("followers_count", -1)])
    
    # Stories collection indexes
    await db.stories.create_index([("author_id", 1), ("created_at", -1)])
    await db.stories.create_index([("expires_at", 1)])  # For cleanup
    
    # Story views collection indexes
    await db.story_views.create_index([("story_id", 1), ("viewer_id", 1)], unique=True)
    await db.story_views.create_index([("story_id", 1), ("viewed_at", -1)])
    
    # Blocks collection indexes
    await db.blocks.create_index([("blocker_id", 1), ("blocked_id", 1)], unique=True)
    await db.blocks.create_index([("blocked_id", 1)])
    
    # Reports collection indexes
    await db.reports.create_index([("target_type", 1), ("target_id", 1)])
    await db.reports.create_index([("status", 1), ("created_at", -1)])
    await db.reports.create_index([("reporter_id", 1)])
    
    print("Database indexes created successfully!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_indexes())