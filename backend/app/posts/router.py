from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.models import PostCreate, PostResponse, PostsResponse, PostStatsResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.utils import get_ist_now
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/posts", tags=["posts"])

# Helper function to convert ObjectId to string in posts
def prepare_post_for_response(post: dict) -> dict:
    """Convert ObjectId to string for JSON serialization"""
    if "_id" in post and isinstance(post["_id"], ObjectId):
        post["_id"] = str(post["_id"])
    return post

@router.post("/", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new post"""
    db = get_database()
    
    post_id = str(ObjectId())
    post_doc = {
        "_id": post_id,
        "author_id": current_user["_id"],
        "author_username": current_user["username"],
        "author_photo": current_user.get("photoURL"),
        "content": post.content,
        "media_url": post.media_url,
        "media_type": post.media_type,
        "thumbnail_url": post.thumbnail_url,  # Add thumbnail for videos
        "tags": post.tags,
        "mentions": post.mentions,  # User IDs of mentioned users
        "likes_count": 0,
        "comments_count": 0,
        "views_count": 0,  # Initialize views count
        "created_at": get_ist_now()
    }
    
    await db.posts.insert_one(post_doc)
    
    # Update user's posts count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"posts_count": 1}}
    )
    
    # Send notifications to mentioned users
    if post.mentions:
        for mentioned_user_id in post.mentions:
            if mentioned_user_id != current_user["_id"]:  # Don't notify self
                await create_notification(
                    db=db,
                    recipient_id=mentioned_user_id,
                    notification_type="mention",
                    actor_id=current_user["_id"],
                    post_id=post_id
                )
    
    return PostResponse.model_validate(post_doc)
    
    return PostResponse.model_validate(post_doc)

@router.get("/feed", response_model=PostsResponse)
async def get_feed_posts(
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(20, ge=1, le=50, description="Number of posts to return"),
    sort_by: str = Query("created_at", regex="^(created_at|likes_count|comments_count)$"),
    media_type: str = Query("all", regex="^(all|image|video|text)$"),
    order: str = Query("desc", regex="^(desc|asc)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get feed posts for current user with filtering and sorting"""
    db = get_database()
    
    # Get posts from followed users and own posts
    following_cursor = db.follows.find({"follower_id": current_user["_id"]})
    following_ids = [follow["following_id"] async for follow in following_cursor]
    following_ids.append(current_user["_id"])  # Include own posts
    
    # Build query filter
    query_filter = {"author_id": {"$in": following_ids}}
    if media_type != "all":
        if media_type == "text":
            query_filter["media_url"] = None
        else:
            query_filter["media_type"] = media_type
    
    # Build sort criteria
    sort_direction = -1 if order == "desc" else 1
    sort_criteria = [(sort_by, sort_direction)]
    
    # Get total count for pagination
    total_count = await db.posts.count_documents(query_filter)
    
    # Get posts
    cursor = db.posts.find(query_filter).sort(sort_criteria).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    
    # Check if user liked and bookmarked each post
    for post in posts:
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
    
    return PostsResponse(
        posts=[PostResponse.model_validate(post) for post in posts],
        total_count=total_count,
        has_more=skip + limit < total_count,
        next_skip=skip + limit if skip + limit < total_count else None
    )

@router.get("/explore", response_model=PostsResponse)
async def get_explore_posts(
    skip: int = Query(0, ge=0, description="Number of posts to skip"),
    limit: int = Query(20, ge=1, le=50, description="Number of posts to return"),
    sort_by: str = Query("created_at", regex="^(created_at|likes_count|comments_count)$"),
    media_type: str = Query("all", regex="^(all|image|video|text)$"),
    order: str = Query("desc", regex="^(desc|asc)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get explore posts with filtering and sorting"""
    db = get_database()
    
    # Build query filter
    query_filter = {}
    if media_type != "all":
        if media_type == "text":
            query_filter["media_url"] = None
        else:
            query_filter["media_type"] = media_type
    
    # Build sort criteria
    sort_direction = -1 if order == "desc" else 1
    sort_criteria = [(sort_by, sort_direction)]
    
    # Get total count for pagination
    total_count = await db.posts.count_documents(query_filter)
    
    # Get posts (fetch more than needed to account for privacy filtering)
    cursor = db.posts.find(query_filter).sort(sort_criteria).skip(skip).limit(limit * 2)
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
            filtered_posts.append(post)
            
            # Stop once we have enough posts
            if len(filtered_posts) >= limit:
                break
    
    # Check if user liked and bookmarked each post
    for post in filtered_posts:
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
    
    return PostsResponse(
        posts=[PostResponse.model_validate(post) for post in filtered_posts],
        total_count=total_count,
        has_more=skip + limit < total_count,
        next_skip=skip + limit if skip + limit < total_count else None
    )

@router.get("/stats", response_model=PostStatsResponse)
async def get_posts_stats():
    """Get posts statistics for filters"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_posts": {"$sum": 1},
                "image_posts": {
                    "$sum": {"$cond": [{"$eq": ["$media_type", "image"]}, 1, 0]}
                },
                "video_posts": {
                    "$sum": {"$cond": [{"$eq": ["$media_type", "video"]}, 1, 0]}
                },
                "text_posts": {
                    "$sum": {"$cond": [{"$eq": ["$media_url", None]}, 1, 0]}
                }
            }
        }
    ]
    
    result = await db.posts.aggregate(pipeline).to_list(1)
    
    if result:
        return PostStatsResponse(**result[0])
    else:
        return PostStatsResponse()

@router.get("/user/{user_id}", response_model=List[PostResponse])
async def get_user_posts(
    user_id: str,
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get posts by specific user"""
    db = get_database()
    
    # Check if the user's account is private
    target_user = await db.users.find_one({"_id": user_id})
    
    # If user is private and viewer is not following them (and not viewing own profile)
    if (target_user and target_user.get("is_private", False) and 
        user_id != current_user["_id"]):
        
        # Check if current user is following the target user
        is_following = await db.follows.find_one({
            "follower_id": current_user["_id"],
            "following_id": user_id
        })
        
        # If not following, return empty list
        if not is_following:
            return []
    
    cursor = db.posts.find({
        "author_id": user_id
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    posts = await cursor.to_list(length=limit)
    
    # Check if current user liked and bookmarked each post
    for post in posts:
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
    
    return [PostResponse.model_validate(post) for post in posts]

@router.get("/user/{user_id}/tagged", response_model=List[PostResponse])
async def get_user_tagged_posts(
    user_id: str,
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get posts where user is tagged/mentioned"""
    db = get_database()
    
    cursor = db.posts.find({
        "mentions": user_id
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    posts = await cursor.to_list(length=limit)
    
    # Check if current user liked and bookmarked each post
    for post in posts:
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
    
    return [PostResponse.model_validate(post) for post in posts]

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get single post by ID and track view"""
    db = get_database()
    
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Convert ObjectId to string
    prepare_post_for_response(post)
    
    # Track view (don't count author's own views)
    if post["author_id"] != current_user["_id"]:
        # Check if user already viewed this post
        existing_view = await db.post_views.find_one({
            "post_id": post_id,
            "viewer_id": current_user["_id"]
        })
        
        if not existing_view:
            # Add view
            await db.post_views.insert_one({
                "post_id": post_id,
                "viewer_id": current_user["_id"],
                "viewed_at": get_ist_now()
            })
            
            # Increment view count
            await db.posts.update_one(
                {"_id": post_id},
                {"$inc": {"views_count": 1}}
            )
            post["views_count"] = post.get("views_count", 0) + 1
    
    # Check if user liked and bookmarked the post
    like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    post["is_liked"] = like is not None
    
    bookmark = await db.bookmarks.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    post["is_bookmarked"] = bookmark is not None
    
    return PostResponse.model_validate(post)

@router.post("/{post_id}/like")
async def toggle_like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like or unlike a post"""
    db = get_database()
    
    # Check if post exists
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if already liked
    existing_like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({
            "post_id": post_id,
            "user_id": current_user["_id"]
        })
        
        # Update post likes count
        await db.posts.update_one(
            {"_id": post_id},
            {"$inc": {"likes_count": -1}}
        )
        
        return {"liked": False, "message": "Post unliked"}
    else:
        # Like
        await db.likes.insert_one({
            "post_id": post_id,
            "user_id": current_user["_id"],
            "created_at": get_ist_now()
        })
        
        # Update post likes count
        await db.posts.update_one(
            {"_id": post_id},
            {"$inc": {"likes_count": 1}}
        )
        
        # Create notification for post author
        await create_notification(
            db=db,
            recipient_id=post["author_id"],
            notification_type="like",
            actor_id=current_user["_id"],
            post_id=post_id
        )
        
        return {"liked": True, "message": "Post liked"}

@router.post("/{post_id}/bookmark")
async def toggle_bookmark_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Bookmark or unbookmark a post"""
    db = get_database()
    
    # Check if post exists
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if already bookmarked
    existing_bookmark = await db.bookmarks.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    
    if existing_bookmark:
        # Remove bookmark
        await db.bookmarks.delete_one({
            "post_id": post_id,
            "user_id": current_user["_id"]
        })
        
        return {"bookmarked": False, "message": "Post unbookmarked"}
    else:
        # Add bookmark
        await db.bookmarks.insert_one({
            "post_id": post_id,
            "user_id": current_user["_id"],
            "created_at": get_ist_now()
        })
        
        return {"bookmarked": True, "message": "Post bookmarked"}

@router.get("/{post_id}/liked", response_model=bool)
async def has_user_liked_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if user has liked a post"""
    db = get_database()
    
    like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    
    return like is not None

@router.get("/{post_id}/bookmarked", response_model=bool)
async def has_user_bookmarked_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if user has bookmarked a post"""
    db = get_database()
    
    bookmark = await db.bookmarks.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    
    return bookmark is not None

@router.get("/bookmarks/my", response_model=List[PostResponse])
async def get_my_bookmarked_posts(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's bookmarked posts"""
    db = get_database()
    
    # Get bookmarked post IDs
    bookmark_cursor = db.bookmarks.find({
        "user_id": current_user["_id"]
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    bookmarks = await bookmark_cursor.to_list(length=limit)
    post_ids = [bookmark["post_id"] for bookmark in bookmarks]
    
    if not post_ids:
        return []
    
    # Get the actual posts
    posts_cursor = db.posts.find({"_id": {"$in": post_ids}})
    posts = await posts_cursor.to_list(length=len(post_ids))
    
    # Check if current user liked each post
    for post in posts:
        like = await db.likes.find_one({
            "post_id": post["_id"],
            "user_id": current_user["_id"]
        })
        post["is_liked"] = like is not None
        post["is_bookmarked"] = True  # All these posts are bookmarked
    
    return [PostResponse.model_validate(post) for post in posts]

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post: PostCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a post (only by the author)"""
    db = get_database()
    
    # Check if post exists and user is the author
    existing_post = await db.posts.find_one({"_id": post_id})
    if not existing_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if existing_post["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts"
        )
    
    # Update post
    update_data = {
        "content": post.content,
        "media_url": post.media_url,
        "media_type": post.media_type,
        "thumbnail_url": post.thumbnail_url,  # Add thumbnail for videos
        "tags": post.tags,
        "updated_at": get_ist_now()
    }
    
    await db.posts.update_one(
        {"_id": post_id},
        {"$set": update_data}
    )
    
    # Get updated post
    updated_post = await db.posts.find_one({"_id": post_id})
    
    # Convert ObjectId to string
    updated_post["_id"] = str(updated_post["_id"])
    
    # Check if user liked and bookmarked the post
    like = await db.likes.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    updated_post["is_liked"] = like is not None
    
    bookmark = await db.bookmarks.find_one({
        "post_id": post_id,
        "user_id": current_user["_id"]
    })
    updated_post["is_bookmarked"] = bookmark is not None
    
    return PostResponse.model_validate(updated_post)

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a post (only by the author)"""
    db = get_database()
    
    # Check if post exists and user is the author
    existing_post = await db.posts.find_one({"_id": post_id})
    if not existing_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if existing_post["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts"
        )
    
    # Delete related data
    await db.likes.delete_many({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.bookmarks.delete_many({"post_id": post_id})  # Delete bookmarks too
    
    # Delete the post
    await db.posts.delete_one({"_id": post_id})
    
    # Update user's posts count
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"posts_count": -1}}
    )
    
    return {"message": "Post deleted successfully"}
