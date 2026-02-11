from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import StoryCreate, StoryResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils import get_ist_now
from datetime import timedelta, datetime
from bson import ObjectId

router = APIRouter(prefix="/stories", tags=["stories"])

@router.post("/", response_model=StoryResponse)
async def create_story(
    story: StoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new story (expires in 24 hours)"""
    db = get_database()
    
    story_id = str(ObjectId())
    now = get_ist_now()
    expires_at = now + timedelta(hours=24)
    
    story_doc = {
        "_id": story_id,
        "author_id": current_user["_id"],
        "author_username": current_user["username"],
        "author_displayName": current_user["displayName"],
        "author_photo": current_user.get("photoURL"),
        "media_url": story.media_url,
        "media_type": story.media_type,
        "thumbnail_url": story.thumbnail_url,
        "views_count": 0,
        "created_at": now,
        "expires_at": expires_at
    }
    
    await db.stories.insert_one(story_doc)
    
    return StoryResponse(**story_doc)

@router.get("/active", response_model=List[dict])
async def get_active_stories(
    current_user: dict = Depends(get_current_user)
):
    """Get all active stories from followed users and self"""
    db = get_database()
    
    # Get list of users current user follows
    cursor = db.follows.find({"follower_id": current_user["_id"]})
    follows = await cursor.to_list(length=1000)
    following_ids = [follow["following_id"] for follow in follows]
    
    # Include current user's ID
    user_ids = following_ids + [current_user["_id"]]
    
    # Get active stories (not expired) from these users
    now = get_ist_now()
    cursor = db.stories.find({
        "author_id": {"$in": user_ids},
        "expires_at": {"$gt": now}
    }).sort("created_at", -1)
    
    stories = await cursor.to_list(length=1000)
    
    # Group stories by author
    stories_by_author = {}
    for story in stories:
        author_id = story["author_id"]
        if author_id not in stories_by_author:
            stories_by_author[author_id] = {
                "author_id": author_id,
                "author_username": story["author_username"],
                "author_displayName": story["author_displayName"],
                "author_photo": story.get("author_photo"),
                "stories": [],
                "has_unseen": False
            }
        
        # Check if story is viewed by current user
        view = await db.story_views.find_one({
            "story_id": story["_id"],
            "viewer_id": current_user["_id"]
        })
        
        story["is_viewed"] = view is not None
        if not story["is_viewed"]:
            stories_by_author[author_id]["has_unseen"] = True
        
        stories_by_author[author_id]["stories"].append(StoryResponse(**story).model_dump(by_alias=True))
    
    # Convert to list and sort (current user first, then by has_unseen)
    result = list(stories_by_author.values())
    result.sort(key=lambda x: (
        x["author_id"] != current_user["_id"],  # Current user first
        not x["has_unseen"],  # Unseen stories next
        -len(x["stories"])  # Then by story count
    ))
    
    return result

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific story"""
    db = get_database()
    
    story = await db.stories.find_one({"_id": story_id})
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Check if expired
    if story["expires_at"] < get_ist_now():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story has expired"
        )
    
    # Check if viewed
    view = await db.story_views.find_one({
        "story_id": story_id,
        "viewer_id": current_user["_id"]
    })
    story["is_viewed"] = view is not None
    
    return StoryResponse(**story)

@router.post("/{story_id}/view")
async def mark_story_viewed(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a story as viewed"""
    db = get_database()
    
    # Check if story exists
    story = await db.stories.find_one({"_id": story_id})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Don't count views from story author
    if story["author_id"] == current_user["_id"]:
        return {"message": "Own story view not counted"}
    
    # Check if already viewed
    existing_view = await db.story_views.find_one({
        "story_id": story_id,
        "viewer_id": current_user["_id"]
    })
    
    if not existing_view:
        # Add view
        await db.story_views.insert_one({
            "story_id": story_id,
            "viewer_id": current_user["_id"],
            "viewer_username": current_user["username"],
            "viewer_displayName": current_user["displayName"],
            "viewer_photo": current_user.get("photoURL"),
            "viewed_at": get_ist_now()
        })
        
        # Increment view count
        await db.stories.update_one(
            {"_id": story_id},
            {"$inc": {"views_count": 1}}
        )
    
    return {"message": "Story viewed"}

@router.get("/{story_id}/viewers", response_model=List[dict])
async def get_story_viewers(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get list of users who viewed the story"""
    db = get_database()
    
    # Check if story belongs to current user
    story = await db.stories.find_one({"_id": story_id})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    if story["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own story viewers"
        )
    
    # Get viewers
    cursor = db.story_views.find({"story_id": story_id}).sort("viewed_at", -1)
    views = await cursor.to_list(length=1000)
    
    return [{
        "viewer_id": view["viewer_id"],
        "viewer_username": view["viewer_username"],
        "viewer_displayName": view["viewer_displayName"],
        "viewer_photo": view.get("viewer_photo"),
        "viewed_at": view["viewed_at"]
    } for view in views]

@router.delete("/{story_id}")
async def delete_story(
    story_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a story"""
    db = get_database()
    
    story = await db.stories.find_one({"_id": story_id})
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    if story["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own stories"
        )
    
    # Delete story
    await db.stories.delete_one({"_id": story_id})
    
    # Delete all views
    await db.story_views.delete_many({"story_id": story_id})
    
    return {"message": "Story deleted successfully"}

# Background task to clean up expired stories
async def cleanup_expired_stories():
    """Delete expired stories (run periodically)"""
    db = get_database()
    
    now = get_ist_now()
    
    # Find expired stories
    cursor = db.stories.find({"expires_at": {"$lt": now}})
    expired_stories = await cursor.to_list(length=10000)
    
    if expired_stories:
        expired_ids = [story["_id"] for story in expired_stories]
        
        # Delete expired stories
        await db.stories.delete_many({"_id": {"$in": expired_ids}})
        
        # Delete their views
        await db.story_views.delete_many({"story_id": {"$in": expired_ids}})
        
        print(f"Cleaned up {len(expired_ids)} expired stories")
