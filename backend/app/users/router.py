from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.models import UserResponse, UserUpdate
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.utils import get_ist_now
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user)

@router.get("/trending", response_model=List[UserResponse])
async def get_trending_users(limit: int = 10):
    """Get trending users by followers count"""
    db = get_database()
    
    cursor = db.users.find().sort("followers_count", -1).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return [UserResponse(**user) for user in users]

@router.get("/search/{query}", response_model=List[UserResponse])
async def search_users(query: str, limit: int = 20):
    """Search users by username or display name"""
    db = get_database()
    
    # Create regex pattern for case-insensitive search
    pattern = {"$regex": query, "$options": "i"}
    
    cursor = db.users.find({
        "$or": [
            {"username": pattern},
            {"displayName": pattern}
        ]
    }).limit(limit)
    
    users = await cursor.to_list(length=limit)
    return [UserResponse(**user) for user in users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    """Get user profile by ID"""
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(**user)

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    db = get_database()
    
    update_data = {}
    if user_update.displayName is not None:
        update_data["displayName"] = user_update.displayName
    if user_update.bio is not None:
        update_data["bio"] = user_update.bio
    if user_update.photoURL is not None:
        update_data["photoURL"] = user_update.photoURL
    if user_update.is_private is not None:
        update_data["is_private"] = user_update.is_private
    
    if update_data:
        update_data["updated_at"] = get_ist_now()
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
        
        # If photoURL was updated, also update all user's posts
        if user_update.photoURL is not None:
            await db.posts.update_many(
                {"author_id": current_user["_id"]},
                {"$set": {"author_photo": user_update.photoURL}}
            )
            
            # Also update comments
            await db.comments.update_many(
                {"author_id": current_user["_id"]},
                {"$set": {"author_photo": user_update.photoURL}}
            )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    # Convert ObjectId to string
    if "_id" in updated_user and isinstance(updated_user["_id"], ObjectId):
        updated_user["_id"] = str(updated_user["_id"])
    
    return UserResponse.model_validate(updated_user)

@router.post("/follow/{user_id}")
async def toggle_follow_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Follow or unfollow a user (creates follow request for private accounts)"""
    db = get_database()
    
    if user_id == current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )
    
    # Check if target user exists
    target_user = await db.users.find_one({"_id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already following
    existing_follow = await db.follows.find_one({
        "follower_id": current_user["_id"],
        "following_id": user_id
    })
    
    # Check if there's a pending follow request
    existing_request = await db.follow_requests.find_one({
        "requester_id": current_user["_id"],
        "target_id": user_id,
        "status": "pending"
    })
    
    if existing_follow:
        # Unfollow
        await db.follows.delete_one({
            "follower_id": current_user["_id"],
            "following_id": user_id
        })
        
        # Update counters
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$inc": {"following_count": -1}}
        )
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {"followers_count": -1}}
        )
        
        return {"following": False, "requested": False, "message": "Unfollowed user"}
    
    elif existing_request:
        # Cancel follow request
        await db.follow_requests.delete_one({
            "requester_id": current_user["_id"],
            "target_id": user_id,
            "status": "pending"
        })
        
        return {"following": False, "requested": False, "message": "Follow request cancelled"}
    
    else:
        # Check if target account is private
        if target_user.get("is_private", False):
            # Create follow request instead of following directly
            request_id = str(ObjectId())
            await db.follow_requests.insert_one({
                "_id": request_id,
                "requester_id": current_user["_id"],
                "target_id": user_id,
                "status": "pending",
                "created_at": get_ist_now()
            })
            
            # Create notification for follow request
            await create_notification(
                db=db,
                recipient_id=user_id,
                notification_type="follow_request",
                actor_id=current_user["_id"]
            )
            
            return {"following": False, "requested": True, "message": "Follow request sent"}
        else:
            # Follow directly (public account)
            await db.follows.insert_one({
                "follower_id": current_user["_id"],
                "following_id": user_id,
                "created_at": get_ist_now()
            })
            
            # Update counters
            await db.users.update_one(
                {"_id": current_user["_id"]},
                {"$inc": {"following_count": 1}}
            )
            await db.users.update_one(
                {"_id": user_id},
                {"$inc": {"followers_count": 1}}
            )
            
            # Create notification for followed user
            await create_notification(
                db=db,
                recipient_id=user_id,
                notification_type="follow",
                actor_id=current_user["_id"]
            )
            
            return {"following": True, "requested": False, "message": "Followed user"}

@router.get("/{user_id}/following", response_model=bool)
async def is_following_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if current user is following another user"""
    db = get_database()
    
    follow = await db.follows.find_one({
        "follower_id": current_user["_id"],
        "following_id": user_id
    })
    
    return follow is not None

@router.get("/{user_id}/follow-status")
async def get_follow_status(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check follow status (following, requested, or none)"""
    db = get_database()
    
    # Check if following
    follow = await db.follows.find_one({
        "follower_id": current_user["_id"],
        "following_id": user_id
    })
    
    if follow:
        return {"following": True, "requested": False}
    
    # Check if there's a pending request
    request = await db.follow_requests.find_one({
        "requester_id": current_user["_id"],
        "target_id": user_id,
        "status": "pending"
    })
    
    if request:
        return {"following": False, "requested": True}
    
    return {"following": False, "requested": False}

@router.get("/follow-requests/pending")
async def get_pending_follow_requests(
    current_user: dict = Depends(get_current_user)
):
    """Get pending follow requests for current user"""
    db = get_database()
    
    cursor = db.follow_requests.find({
        "target_id": current_user["_id"],
        "status": "pending"
    }).sort("created_at", -1)
    
    requests = await cursor.to_list(length=100)
    
    # Get requester details
    result = []
    for req in requests:
        requester = await db.users.find_one({"_id": req["requester_id"]})
        if requester:
            result.append({
                "request_id": str(req["_id"]) if isinstance(req["_id"], ObjectId) else req["_id"],
                "requester_id": req["requester_id"],
                "username": requester["username"],
                "displayName": requester["displayName"],
                "photoURL": requester.get("photoURL"),
                "created_at": req["created_at"]
            })
    
    return result

@router.post("/follow-requests/{request_id}/accept")
async def accept_follow_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept a follow request"""
    db = get_database()
    
    print(f"DEBUG: Accepting request_id: {request_id}, type: {type(request_id)}")
    
    # Get the request - try both string and ObjectId
    request = await db.follow_requests.find_one({
        "_id": request_id,
        "target_id": current_user["_id"],
        "status": "pending"
    })
    
    print(f"DEBUG: Found request: {request}")
    
    if not request:
        # Try with ObjectId if string didn't work
        try:
            from bson import ObjectId as BsonObjectId
            request = await db.follow_requests.find_one({
                "_id": BsonObjectId(request_id),
                "target_id": current_user["_id"],
                "status": "pending"
            })
            print(f"DEBUG: Found request with ObjectId: {request}")
        except:
            pass
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Follow request not found for id: {request_id}"
        )
    
    # Create follow relationship
    await db.follows.insert_one({
        "follower_id": request["requester_id"],
        "following_id": current_user["_id"],
        "created_at": get_ist_now()
    })
    
    # Update counters
    await db.users.update_one(
        {"_id": request["requester_id"]},
        {"$inc": {"following_count": 1}}
    )
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"followers_count": 1}}
    )
    
    # Update request status - use the same ID format that worked for finding
    update_id = request["_id"]
    await db.follow_requests.update_one(
        {"_id": update_id},
        {"$set": {"status": "accepted", "updated_at": get_ist_now()}}
    )
    
    # Create notification for requester
    await create_notification(
        db=db,
        recipient_id=request["requester_id"],
        notification_type="follow_accepted",
        actor_id=current_user["_id"]
    )
    
    return {"message": "Follow request accepted"}

@router.post("/follow-requests/{request_id}/reject")
async def reject_follow_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a follow request"""
    db = get_database()
    
    # Get the request - try both string and ObjectId
    request = await db.follow_requests.find_one({
        "_id": request_id,
        "target_id": current_user["_id"],
        "status": "pending"
    })
    
    if not request:
        # Try with ObjectId if string didn't work
        try:
            from bson import ObjectId as BsonObjectId
            request = await db.follow_requests.find_one({
                "_id": BsonObjectId(request_id),
                "target_id": current_user["_id"],
                "status": "pending"
            })
        except:
            pass
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow request not found"
        )
    
    # Update request status - use the same ID format that worked for finding
    update_id = request["_id"]
    await db.follow_requests.update_one(
        {"_id": update_id},
        {"$set": {"status": "rejected", "updated_at": get_ist_now()}}
    )
    
    return {"message": "Follow request rejected"}

@router.get("/{user_id}/following-list", response_model=List[UserResponse])
async def get_user_following_list(
    user_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get list of users that the specified user is following"""
    db = get_database()
    
    # Get following IDs
    cursor = db.follows.find({"follower_id": user_id}).limit(limit)
    follows = await cursor.to_list(length=limit)
    
    if not follows:
        return []
    
    following_ids = [follow["following_id"] for follow in follows]
    
    # Get user details
    cursor = db.users.find({"_id": {"$in": following_ids}})
    users = await cursor.to_list(length=len(following_ids))
    
    return [UserResponse(**user) for user in users]