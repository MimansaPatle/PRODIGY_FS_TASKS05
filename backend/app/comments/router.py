from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import CommentCreate, CommentResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.utils import get_ist_now
from bson import ObjectId

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/posts/{post_id}", response_model=CommentResponse)
async def add_comment(
    post_id: str,
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a post"""
    db = get_database()
    
    # Check if post exists
    post = await db.posts.find_one({"_id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comment_id = str(ObjectId())
    comment_doc = {
        "_id": comment_id,
        "post_id": post_id,
        "author_id": current_user["_id"],
        "author_username": current_user["username"],
        "author_displayName": current_user["displayName"],
        "author_photo": current_user.get("photoURL"),
        "content": comment.content,
        "parent_id": comment.parent_id,  # Support nested comments
        "replies_count": 0,
        "created_at": get_ist_now(),
        "updated_at": None
    }
    
    await db.comments.insert_one(comment_doc)
    
    # If this is a reply, update parent comment's reply count
    if comment.parent_id:
        await db.comments.update_one(
            {"_id": comment.parent_id},
            {"$inc": {"replies_count": 1}}
        )
    
    # Update post comments count
    await db.posts.update_one(
        {"_id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    # Create notification for post author
    await create_notification(
        db=db,
        recipient_id=post["author_id"],
        notification_type="comment",
        actor_id=current_user["_id"],
        post_id=post_id,
        comment_id=comment_id
    )
    
    return CommentResponse(**comment_doc)

@router.get("/posts/{post_id}", response_model=List[CommentResponse])
async def get_post_comments(
    post_id: str,
    limit: int = 50,
    skip: int = 0
):
    """Get top-level comments for a post (not replies)"""
    db = get_database()
    
    cursor = db.comments.find({
        "post_id": post_id,
        "parent_id": None  # Only top-level comments
    }).sort("created_at", 1).skip(skip).limit(limit)
    
    comments = await cursor.to_list(length=limit)
    return [CommentResponse(**comment) for comment in comments]

@router.get("/{comment_id}/replies", response_model=List[CommentResponse])
async def get_comment_replies(
    comment_id: str,
    limit: int = 50,
    skip: int = 0
):
    """Get replies to a specific comment"""
    db = get_database()
    
    cursor = db.comments.find({
        "parent_id": comment_id
    }).sort("created_at", 1).skip(skip).limit(limit)
    
    replies = await cursor.to_list(length=limit)
    return [CommentResponse(**reply) for reply in replies]

@router.put("/{comment_id}", response_model=CommentResponse)
async def edit_comment(
    comment_id: str,
    comment_update: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Edit a comment (only by author)"""
    db = get_database()
    
    comment = await db.comments.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this comment"
        )
    
    # Update comment
    await db.comments.update_one(
        {"_id": comment_id},
        {"$set": {
            "content": comment_update.content,
            "updated_at": get_ist_now()
        }}
    )
    
    # Get updated comment
    updated_comment = await db.comments.find_one({"_id": comment_id})
    return CommentResponse(**updated_comment)

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment (only by author)"""
    db = get_database()
    
    comment = await db.comments.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment["author_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    # Delete comment
    await db.comments.delete_one({"_id": comment_id})
    
    # If this was a reply, update parent comment's reply count
    if comment.get("parent_id"):
        await db.comments.update_one(
            {"_id": comment["parent_id"]},
            {"$inc": {"replies_count": -1}}
        )
    
    # Delete all replies to this comment
    replies = await db.comments.find({"parent_id": comment_id}).to_list(length=1000)
    if replies:
        reply_ids = [reply["_id"] for reply in replies]
        await db.comments.delete_many({"_id": {"$in": reply_ids}})
        # Adjust comment count for deleted replies
        await db.posts.update_one(
            {"_id": comment["post_id"]},
            {"$inc": {"comments_count": -len(replies)}}
        )
    
    # Update post comments count
    await db.posts.update_one(
        {"_id": comment["post_id"]},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted successfully"}