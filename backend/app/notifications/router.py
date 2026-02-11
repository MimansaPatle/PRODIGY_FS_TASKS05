from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.models import NotificationResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils import get_ist_now
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for the current user"""
    db = get_database()
    
    # Build query filter
    query_filter = {"recipient_id": current_user["_id"]}
    if unread_only:
        query_filter["read"] = False
    
    # Get notifications
    cursor = db.notifications.find(query_filter).sort("created_at", -1).skip(skip).limit(limit)
    notifications = await cursor.to_list(length=limit)
    
    # Populate actor and post/comment data
    for notification in notifications:
        # Get actor info
        actor = await db.users.find_one({"_id": notification["actor_id"]})
        if actor:
            notification["actor_username"] = actor["username"]
            notification["actor_displayName"] = actor["displayName"]
            notification["actor_photo"] = actor.get("photoURL")
        
        # Get post info if applicable
        if notification.get("post_id"):
            post = await db.posts.find_one({"_id": notification["post_id"]})
            if post:
                notification["post_content"] = post["content"]
                notification["post_media_url"] = post.get("media_url")
        
        # Get comment info if applicable
        if notification.get("comment_id"):
            comment = await db.comments.find_one({"_id": notification["comment_id"]})
            if comment:
                notification["comment_content"] = comment["content"]
    
    return [NotificationResponse(**notification) for notification in notifications]

@router.get("/unread-count", response_model=int)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications"""
    db = get_database()
    
    count = await db.notifications.count_documents({
        "recipient_id": current_user["_id"],
        "read": False
    })
    
    return count

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    db = get_database()
    
    # Verify notification exists and belongs to current user
    notification = await db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification["recipient_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark your own notifications as read"
        )
    
    await db.notifications.update_one(
        {"_id": notification_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    db = get_database()
    
    result = await db.notifications.update_many(
        {"recipient_id": current_user["_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    db = get_database()
    
    # Verify notification exists and belongs to current user
    notification = await db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification["recipient_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own notifications"
        )
    
    await db.notifications.delete_one({"_id": notification_id})
    
    return {"message": "Notification deleted successfully"}

# Helper function to create notifications (used by other routers)
async def create_notification(
    db,
    recipient_id: str,
    notification_type: str,
    actor_id: str,
    post_id: str = None,
    comment_id: str = None
):
    """Create a new notification"""
    # Don't create notification if actor is the same as recipient
    if actor_id == recipient_id:
        return
    
    # Check if similar notification already exists (to avoid spam)
    existing = await db.notifications.find_one({
        "recipient_id": recipient_id,
        "type": notification_type,
        "actor_id": actor_id,
        "post_id": post_id,
        "comment_id": comment_id
    })
    
    if existing:
        # Update timestamp instead of creating duplicate
        await db.notifications.update_one(
            {"_id": existing["_id"]},
            {"$set": {"created_at": get_ist_now(), "read": False}}
        )
        return
    
    notification_id = str(ObjectId())
    notification_doc = {
        "_id": notification_id,
        "recipient_id": recipient_id,
        "type": notification_type,
        "actor_id": actor_id,
        "post_id": post_id,
        "comment_id": comment_id,
        "created_at": get_ist_now(),
        "read": False
    }
    
    await db.notifications.insert_one(notification_doc)
    return notification_id