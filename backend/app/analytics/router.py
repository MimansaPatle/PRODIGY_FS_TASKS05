from fastapi import APIRouter, HTTPException, status, Depends
from app.database import get_database
from app.utils import get_ist_now
from app.auth.dependencies import get_current_user
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/trending")
async def get_trending_posts(limit: int = 10) -> List[Dict[str, Any]]:
    """Get trending posts from the last 7 days ordered by likes count"""
    db = get_database()
    
    # Calculate date 7 days ago
    seven_days_ago = get_ist_now() - timedelta(days=7)
    
    # Aggregate pipeline to get trending posts
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": seven_days_ago}
            }
        },
        {
            "$sort": {"likes_count": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    cursor = db.posts.aggregate(pipeline)
    posts = await cursor.to_list(length=limit)
    
    return posts

@router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str) -> Dict[str, Any]:
    """Get user statistics"""
    db = get_database()
    
    # Get user
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get total likes on user's posts
    pipeline = [
        {"$match": {"author_id": user_id}},
        {"$group": {"_id": None, "total_likes": {"$sum": "$likes_count"}}}
    ]
    
    result = await db.posts.aggregate(pipeline).to_list(length=1)
    total_likes = result[0]["total_likes"] if result else 0
    
    return {
        "user_id": user_id,
        "username": user["username"],
        "posts_count": user["posts_count"],
        "followers_count": user["followers_count"],
        "following_count": user["following_count"],
        "total_likes_received": total_likes,
        "created_at": user["created_at"]
    }

@router.get("/dashboard")
async def get_analytics_dashboard(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive analytics dashboard for current user"""
    db = get_database()
    user_id = current_user["uid"]
    
    # Get user's posts
    posts = await db.posts.find({"author_id": user_id}).to_list(length=None)
    
    # Calculate engagement metrics
    total_posts = len(posts)
    total_likes = sum(post.get("likes_count", 0) for post in posts)
    total_comments = sum(post.get("comments_count", 0) for post in posts)
    total_views = sum(post.get("views_count", 0) for post in posts)
    
    # Get follower/following counts
    user = await db.users.find_one({"_id": user_id})
    followers_count = user.get("followers_count", 0) if user else 0
    following_count = user.get("following_count", 0) if user else 0
    
    # Calculate engagement rate
    engagement_rate = 0
    if total_views > 0:
        engagement_rate = ((total_likes + total_comments) / total_views) * 100
    
    # Get posts by date (last 30 days)
    thirty_days_ago = get_ist_now() - timedelta(days=30)
    posts_by_date = {}
    
    for post in posts:
        post_date = post.get("created_at")
        if post_date and post_date >= thirty_days_ago:
            date_key = post_date.strftime("%Y-%m-%d")
            if date_key not in posts_by_date:
                posts_by_date[date_key] = {
                    "date": date_key,
                    "posts": 0,
                    "likes": 0,
                    "comments": 0,
                    "views": 0
                }
            posts_by_date[date_key]["posts"] += 1
            posts_by_date[date_key]["likes"] += post.get("likes_count", 0)
            posts_by_date[date_key]["comments"] += post.get("comments_count", 0)
            posts_by_date[date_key]["views"] += post.get("views_count", 0)
    
    # Get top performing posts
    top_posts = sorted(posts, key=lambda x: x.get("likes_count", 0), reverse=True)[:5]
    top_posts_data = [
        {
            "id": str(post.get("_id")),
            "content": post.get("content", "")[:100],
            "media_url": post.get("media_url"),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "views_count": post.get("views_count", 0),
            "created_at": post.get("created_at")
        }
        for post in top_posts
    ]
    
    # Get recent activity (notifications)
    recent_notifications = await db.notifications.find(
        {"recipient_id": user_id}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    # Calculate growth metrics (compare last 7 days vs previous 7 days)
    seven_days_ago = get_ist_now() - timedelta(days=7)
    fourteen_days_ago = get_ist_now() - timedelta(days=14)
    
    recent_posts = [p for p in posts if p.get("created_at") and p.get("created_at") >= seven_days_ago]
    previous_posts = [p for p in posts if p.get("created_at") and fourteen_days_ago <= p.get("created_at") < seven_days_ago]
    
    recent_likes = sum(p.get("likes_count", 0) for p in recent_posts)
    previous_likes = sum(p.get("likes_count", 0) for p in previous_posts)
    
    likes_growth = 0
    if previous_likes > 0:
        likes_growth = ((recent_likes - previous_likes) / previous_likes) * 100
    
    return {
        "overview": {
            "total_posts": total_posts,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_views": total_views,
            "followers_count": followers_count,
            "following_count": following_count,
            "engagement_rate": round(engagement_rate, 2),
            "likes_growth": round(likes_growth, 2)
        },
        "posts_by_date": list(posts_by_date.values()),
        "top_posts": top_posts_data,
        "recent_activity": [
            {
                "id": str(notif.get("_id")),
                "type": notif.get("type"),
                "message": notif.get("message"),
                "created_at": notif.get("created_at"),
                "read": notif.get("read", False)
            }
            for notif in recent_notifications
        ]
    }

@router.get("/search/advanced")
async def advanced_search(
    query: Optional[str] = None,
    media_type: Optional[str] = None,  # image, video, text
    has_media: Optional[bool] = None,
    min_likes: Optional[int] = None,
    max_likes: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    tags: Optional[str] = None,  # comma-separated
    author_id: Optional[str] = None,
    sort_by: str = "created_at",  # created_at, likes_count, comments_count, views_count
    sort_order: str = "desc",  # asc, desc
    limit: int = 20,
    skip: int = 0
) -> Dict[str, Any]:
    """Advanced search for posts with multiple filters"""
    db = get_database()
    
    # Build query
    search_query = {}
    
    # Text search
    if query:
        search_query["$or"] = [
            {"content": {"$regex": query, "$options": "i"}},
            {"author_username": {"$regex": query, "$options": "i"}}
        ]
    
    # Media type filter
    if media_type:
        if media_type == "text":
            search_query["media_url"] = {"$exists": False}
        else:
            search_query["media_type"] = media_type
    
    # Has media filter
    if has_media is not None:
        if has_media:
            search_query["media_url"] = {"$exists": True, "$ne": None}
        else:
            search_query["$or"] = [
                {"media_url": {"$exists": False}},
                {"media_url": None}
            ]
    
    # Likes range filter
    if min_likes is not None or max_likes is not None:
        likes_filter = {}
        if min_likes is not None:
            likes_filter["$gte"] = min_likes
        if max_likes is not None:
            likes_filter["$lte"] = max_likes
        search_query["likes_count"] = likes_filter
    
    # Date range filter
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        search_query["created_at"] = date_filter
    
    # Tags filter
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        search_query["tags"] = {"$in": tag_list}
    
    # Author filter
    if author_id:
        search_query["author_id"] = author_id
    
    # Get total count
    total = await db.posts.count_documents(search_query)
    
    # Sort direction
    sort_direction = -1 if sort_order == "desc" else 1
    
    # Execute search
    cursor = db.posts.find(search_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string
    for post in posts:
        post["id"] = str(post.pop("_id"))
    
    return {
        "posts": posts,
        "total": total,
        "limit": limit,
        "skip": skip,
        "has_more": (skip + limit) < total
    }