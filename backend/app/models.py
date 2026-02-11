from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)
    displayName: str = Field(..., min_length=1, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    displayName: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    photoURL: Optional[str] = None
    is_private: Optional[bool] = None  # Private account setting

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    displayName: str
    photoURL: Optional[str] = None
    bio: str = ""
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_private: bool = False  # Private account
    is_verified: bool = False  # Verification badge
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

# Post Models
class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    media_url: Optional[str] = None
    media_urls: List[str] = []  # Multiple images/videos
    media_type: Optional[str] = Field(None, pattern="^(image|video)$")
    thumbnail_url: Optional[str] = None  # For video thumbnails
    tags: List[str] = []
    mentions: List[str] = []  # List of mentioned user IDs

class PostResponse(BaseModel):
    id: str = Field(alias="_id")
    author_id: str
    author_username: str
    author_photo: Optional[str] = None
    content: str
    media_url: Optional[str] = None
    media_urls: List[str] = []  # Multiple images/videos
    media_type: Optional[str] = None
    thumbnail_url: Optional[str] = None  # For video thumbnails
    tags: List[str] = []
    mentions: List[str] = []  # List of mentioned user IDs
    likes_count: int = 0
    comments_count: int = 0
    views_count: int = 0  # New field for analytics
    created_at: datetime
    is_liked: Optional[bool] = False
    is_bookmarked: Optional[bool] = False

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Comment Models
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_id: Optional[str] = None  # For nested replies

class CommentResponse(BaseModel):
    id: str = Field(alias="_id")
    post_id: str
    author_id: str
    author_username: str
    author_displayName: str
    author_photo: Optional[str] = None
    content: str
    parent_id: Optional[str] = None  # Parent comment ID for replies
    replies_count: int = 0  # Number of replies
    created_at: datetime
    updated_at: Optional[datetime] = None  # For edit functionality

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Pagination and Filter Models
class PostsResponse(BaseModel):
    posts: List[PostResponse]
    total_count: int
    has_more: bool
    next_skip: Optional[int] = None

class PostStatsResponse(BaseModel):
    total_posts: int = 0
    image_posts: int = 0
    video_posts: int = 0
    text_posts: int = 0

# Message Models
class MessageCreate(BaseModel):
    recipient_id: str
    content: str = Field(..., min_length=1, max_length=1000)
    post_id: Optional[str] = None  # For sharing posts
    story_id: Optional[str] = None  # For replying to stories

class MessageResponse(BaseModel):
    id: str = Field(alias="_id")
    sender_id: str
    recipient_id: str
    content: str
    post_id: Optional[str] = None
    story_id: Optional[str] = None
    post_data: Optional[PostResponse] = None  # Populated when sharing a post
    story_data: Optional[dict] = None  # Populated when replying to story
    created_at: datetime
    read: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ConversationResponse(BaseModel):
    user_id: str
    username: str
    displayName: str
    photoURL: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

# Notification Models
class NotificationCreate(BaseModel):
    recipient_id: str
    type: str = Field(..., pattern="^(like|comment|follow|follow_request|follow_accepted|mention)$")
    actor_id: str
    post_id: Optional[str] = None
    comment_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str = Field(alias="_id")
    recipient_id: str
    type: str
    actor_id: str
    actor_username: str
    actor_displayName: str
    actor_photo: Optional[str] = None
    post_id: Optional[str] = None
    post_content: Optional[str] = None
    post_media_url: Optional[str] = None
    comment_id: Optional[str] = None
    comment_content: Optional[str] = None
    created_at: datetime
    read: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Story Models
class StoryCreate(BaseModel):
    media_url: str
    media_type: str = Field(..., pattern="^(image|video)$")
    thumbnail_url: Optional[str] = None

class StoryResponse(BaseModel):
    id: str = Field(alias="_id")
    author_id: str
    author_username: str
    author_displayName: str
    author_photo: Optional[str] = None
    media_url: str
    media_type: str
    thumbnail_url: Optional[str] = None
    views_count: int = 0
    created_at: datetime
    expires_at: datetime
    is_viewed: Optional[bool] = False

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None