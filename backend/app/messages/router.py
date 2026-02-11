from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.models import MessageCreate, MessageResponse, ConversationResponse, PostResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils import get_ist_now
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to another user"""
    db = get_database()
    
    # Check if recipient exists
    recipient = await db.users.find_one({"_id": message.recipient_id})
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # If sharing a post, verify it exists
    post_data = None
    if message.post_id:
        post = await db.posts.find_one({"_id": message.post_id})
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        post_data = PostResponse(**post)
    
    # If replying to a story, verify it exists
    story_data = None
    if message.story_id:
        story = await db.stories.find_one({"_id": message.story_id})
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )
        story_data = {
            "id": story["_id"],
            "media_url": story["media_url"],
            "media_type": story["media_type"],
            "author_id": story["author_id"],
            "created_at": story["created_at"]
        }
    
    message_id = str(ObjectId())
    message_doc = {
        "_id": message_id,
        "sender_id": current_user["_id"],
        "recipient_id": message.recipient_id,
        "content": message.content,
        "post_id": message.post_id,
        "story_id": message.story_id,
        "created_at": get_ist_now(),
        "read": False
    }
    
    await db.messages.insert_one(message_doc)
    
    # Add post data to response if sharing a post
    if post_data:
        message_doc["post_data"] = post_data
    
    # Add story data to response if replying to story
    if story_data:
        message_doc["story_data"] = story_data
    
    return MessageResponse(**message_doc)

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: dict = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    db = get_database()
    
    # Get all unique users the current user has messaged with
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": current_user["_id"]},
                    {"recipient_id": current_user["_id"]}
                ]
            }
        },
        {
            "$addFields": {
                "other_user_id": {
                    "$cond": {
                        "if": {"$eq": ["$sender_id", current_user["_id"]]},
                        "then": "$recipient_id",
                        "else": "$sender_id"
                    }
                }
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": "$other_user_id",
                "last_message": {"$first": "$$ROOT"}
            }
        }
    ]
    
    conversations_data = await db.messages.aggregate(pipeline).to_list(None)
    conversations = []
    
    for conv in conversations_data:
        user_id = conv["_id"]
        last_message = conv["last_message"]
        
        # Get user info
        user = await db.users.find_one({"_id": user_id})
        if not user:
            continue
        
        # Count unread messages from this user
        unread_count = await db.messages.count_documents({
            "sender_id": user_id,
            "recipient_id": current_user["_id"],
            "read": False
        })
        
        conversations.append(ConversationResponse(
            user_id=user_id,
            username=user["username"],
            displayName=user["displayName"],
            photoURL=user.get("photoURL"),
            last_message=MessageResponse(**last_message),
            unread_count=unread_count
        ))
    
    return conversations

@router.get("/{user_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get messages in a conversation with a specific user"""
    db = get_database()
    
    # Verify the other user exists
    other_user = await db.users.find_one({"_id": user_id})
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get messages between current user and specified user
    cursor = db.messages.find({
        "$or": [
            {"sender_id": current_user["_id"], "recipient_id": user_id},
            {"sender_id": user_id, "recipient_id": current_user["_id"]}
        ]
    }).sort("created_at", -1).skip(skip).limit(limit)
    
    messages = await cursor.to_list(length=limit)
    
    # Mark messages from the other user as read
    await db.messages.update_many(
        {
            "sender_id": user_id,
            "recipient_id": current_user["_id"],
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    # Populate post data for shared posts and story data for story replies
    for message in messages:
        if message.get("post_id"):
            post = await db.posts.find_one({"_id": message["post_id"]})
            if post:
                # Check if current user liked the post
                like = await db.likes.find_one({
                    "post_id": message["post_id"],
                    "user_id": current_user["_id"]
                })
                post["is_liked"] = like is not None
                message["post_data"] = PostResponse(**post)
        
        if message.get("story_id"):
            story = await db.stories.find_one({"_id": message["story_id"]})
            if story:
                message["story_data"] = {
                    "id": story["_id"],
                    "media_url": story["media_url"],
                    "media_type": story["media_type"],
                    "author_id": story["author_id"],
                    "created_at": story["created_at"]
                }
    
    # Reverse to show oldest first
    messages.reverse()
    
    return [MessageResponse(**message) for message in messages]

@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a message as read"""
    db = get_database()
    
    # Verify message exists and user is the recipient
    message = await db.messages.find_one({"_id": message_id})
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message["recipient_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark your own messages as read"
        )
    
    await db.messages.update_one(
        {"_id": message_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Message marked as read"}

@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a message (only by sender)"""
    db = get_database()
    
    # Verify message exists and user is the sender
    message = await db.messages.find_one({"_id": message_id})
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message["sender_id"] != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages"
        )
    
    await db.messages.delete_one({"_id": message_id})
    
    return {"message": "Message deleted successfully"}