from fastapi import APIRouter, Depends, Query
from typing import List
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.models import PostResponse
from app.utils import get_ist_now
from datetime import timedelta

router = APIRouter(prefix="/hashtags", tags=["hashtags"])

@router.get("/trending")
async def get_trending_hashtags(
    limit: int = Query(20, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    current_user: dict = Depends(get_current_user)
):
    """Get trending hashtags based on post count in last N days"""
    db = get_database()
    
    # Calculate date range
    since_date = get_ist_now() - timedelta(days=days)
    
    # Aggregate hashtags from recent posts
    pipeline = [
        {"$match": {"created_at": {"$gte": since_date}}},
        {"$unwind": "$tags"},
        {"$match": {"tags": {"$regex": "^#"}}},  # Only hashtags
        {"$group": {
            "_id": "$tags",
            "count": {"$sum": 1},
            "recent_post_ids": {"$push": "$_id"}
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    
    results = await db.posts.aggregate(pipeline).to_list(length=limit)
    
    return [{
        "hashtag": result["_id"],
        "post_count": result["count"],
        "trending_score": result["count"]  # Can be enhanced with engagement metrics
    } for result in results]

@router.get("/{hashtag}/posts")
async def get_posts_by_hashtag(
    hashtag: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get all posts with a specific hashtag"""
    db = get_database()
    
    # Ensure hashtag starts with #
    if not hashtag.startswith('#'):
        hashtag = f"#{hashtag}"
    
    # Find posts with this hashtag (fetch more than needed to account for privacy filtering)
    cursor = db.posts.find({
        "tags": hashtag
    }).sort("created_at", -1).skip(skip).limit(limit * 2)
    
    all_posts = await cursor.to_list(length=limit * 2)
    
    # Get list of users current user is following
    following_cursor = db.follows.find({"follower_id": current_user["_id"]})
    following_ids = [follow["following_id"] async for follow in following_cursor]
    
    # Filter posts based on privacy settings
    filtered_posts = []
    for post in all_posts:
        # Get post author's privacy settings
        author = await db.users.find_one({"_id": post["author_id"]})
        
        # Include post if:
        # 1. Author is not private, OR
        # 2. Current user is the author, OR
        # 3. Current user is following the author
        if (not author or not author.get("is_private", False) or 
            post["author_id"] == current_user["_id"] or 
            post["author_id"] in following_ids):
            
            # Convert ObjectId to string
            post["_id"] = str(post["_id"])
            
            like = await db.likes.find_one({
                "post_id": post["_id"],
                "user_id": current_user["_id"]
            })
            post["is_liked"] = like is not None
            
            bookmark = await db.bookmarks.find_one({
                "post_id": post["_id"],
                "user_id": current_user["_id"]
            })
            post["is_bookmarked"] = bookmark is not None
            
            filtered_posts.append(post)
            
            # Stop once we have enough posts
            if len(filtered_posts) >= limit:
                break
    
    total_count = await db.posts.count_documents({"tags": hashtag})
    
    return {
        "hashtag": hashtag,
        "posts": [PostResponse.model_validate(post) for post in filtered_posts],
        "total_count": total_count,
        "has_more": skip + limit < total_count
    }

@router.get("/search")
async def search_hashtags(
    query: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Search hashtags by prefix"""
    db = get_database()
    
    # Ensure query starts with #
    if not query.startswith('#'):
        query = f"#{query}"
    
    # Aggregate unique hashtags matching the query
    pipeline = [
        {"$unwind": "$tags"},
        {"$match": {"tags": {"$regex": f"^{query}", "$options": "i"}}},
        {"$group": {
            "_id": "$tags",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    
    results = await db.posts.aggregate(pipeline).to_list(length=limit)
    
    return [{
        "hashtag": result["_id"],
        "post_count": result["count"]
    } for result in results]
