# Vois - Visual Social Platform

A modern, full-stack social media application built with React and FastAPI, featuring real-time interactions, stories, messaging, and comprehensive social networking capabilities.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based secure authentication with email verification
- **Posts & Media Sharing** - Create, edit, delete posts with multiple images/videos
- **Stories** - 24-hour ephemeral content with view tracking
- **Comments & Nested Replies** - Multi-level comment threads
- **Real-time Messaging** - Direct messaging between users
- **Notifications** - Real-time updates for likes, comments, follows, and mentions
- **User Profiles** - Customizable profiles with bio, avatar, and cover images
- **Follow System** - Follow/unfollow users with follower/following lists
- **Hashtags** - Trending hashtags and hashtag-based content discovery
- **Search & Explore** - Discover users and content
- **Analytics** - User engagement metrics and insights
- **Moderation** - Content reporting and user blocking

### Advanced Features
- Infinite scroll feed with optimized loading
- Image carousel for multi-media posts
- Lazy loading for images
- Responsive design with Tailwind CSS
- Password reset via email
- User verification badges
- Post sharing functionality
- Mention autocomplete (@username)
- Feed filtering (Following/For You)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form management

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **PyJWT** - JWT token handling
- **Passlib** - Password hashing
- **Python-Jose** - JWT encryption
- **Uvicorn** - ASGI server

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd vois-social-platform
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables
Copy the example file and edit with your values:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

Edit `backend/.env` with your configuration:
```env
# FastAPI
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=vois_social_app

# JWT Security - CHANGE THIS!
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SMTP Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Vois - Visual Social Platform
```

**Gmail Setup:** Enable 2FA and create an App Password at https://myaccount.google.com/apppasswords

#### Firebase Setup (Optional)
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Download the service account key JSON file
3. Save it as `firebase-admin-key.json` in the `backend` directory
4. **Note:** This file is automatically ignored by git

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
Copy the example file and edit:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Database Setup

Start MongoDB:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
python start_server.py
```
Backend runs on `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

## 📁 Project Structure

```
vois-social-platform/
├── backend/
│   ├── app/
│   │   ├── analytics/      # Analytics endpoints
│   │   ├── auth/           # Authentication & authorization
│   │   ├── comments/       # Comment management
│   │   ├── hashtags/       # Hashtag functionality
│   │   ├── messages/       # Direct messaging
│   │   ├── moderation/     # Content moderation
│   │   ├── notifications/  # Notification system
│   │   ├── posts/          # Post CRUD operations
│   │   ├── services/       # Email and other services
│   │   ├── stories/        # Stories feature
│   │   ├── users/          # User management
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # Pydantic models
│   │   └── utils.py        # Utility functions
│   ├── main.py             # FastAPI application entry
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Example environment variables
│   └── .env               # Your config (not in git)
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── context/        # React context (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── config/         # Configuration files
│   │   └── styles/         # CSS files
│   ├── package.json        # Node dependencies
│   ├── .env.example        # Example environment variables
│   └── .env               # Your config (not in git)
│
├── .gitignore             # Git ignore rules
├── LICENSE                # MIT License
└── README.md              # This file
```

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/{user_id}` - Get user by ID
- `POST /users/{user_id}/follow` - Follow user
- `DELETE /users/{user_id}/follow` - Unfollow user

### Posts
- `GET /posts/feed` - Get user feed
- `POST /posts` - Create new post
- `GET /posts/{post_id}` - Get post details
- `PUT /posts/{post_id}` - Update post
- `DELETE /posts/{post_id}` - Delete post
- `POST /posts/{post_id}/like` - Like post

### Comments
- `POST /posts/{post_id}/comments` - Add comment
- `GET /posts/{post_id}/comments` - Get post comments
- `PUT /comments/{comment_id}` - Update comment
- `DELETE /comments/{comment_id}` - Delete comment

### Stories
- `POST /stories` - Create story
- `GET /stories` - Get stories feed
- `POST /stories/{story_id}/view` - Mark story as viewed

### Messages
- `GET /messages/conversations` - Get conversations
- `POST /messages` - Send message
- `GET /messages/{user_id}` - Get conversation with user

### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/{notification_id}/read` - Mark as read

## 🔐 Security & Best Practices

### Before Pushing to GitHub
1. ✅ Verify `.env` files are NOT committed (they're in `.gitignore`)
2. ✅ Verify `firebase-admin-key.json` is NOT committed
3. ✅ Check `git status` before pushing
4. ✅ Use `.env.example` files to show required configuration

### Production Checklist
- Change `SECRET_KEY` to a strong random value
- Use production database (MongoDB Atlas)
- Enable HTTPS
- Set up proper CORS policies
- Implement rate limiting
- Use environment-specific configurations
- Enable database backups
- Set up monitoring and logging

## 🐛 Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `net start MongoDB` (Windows)
- Check `MONGODB_URL` in `backend/.env`

### CORS Error
- Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Check `VITE_API_URL` in `frontend/.env`

### Email Not Sending
- Use Gmail App Password (not regular password)
- Enable 2FA on Gmail account
- Generate App Password: https://myaccount.google.com/apppasswords

### Port Already in Use
```bash
# Windows - Kill process on port
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Guidelines
- Use present tense ("Add feature" not "Added feature")
- Keep first line under 50 characters
- Reference issues when relevant

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, open an issue in the repository or contact the maintainers.

---

**Made with ❤️ using React and FastAPI**
