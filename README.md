# 🌹 Pixora - Visual Social Media Platform

A modern, feature-rich social media platform with a stunning rose-themed dark design. Built for visual storytellers and content creators.

## ✨ Features

### Core Functionality
- 🔐 **Authentication** - Secure login/register with JWT tokens and password reset
- 📝 **Posts** - Create, edit, delete posts with images/videos
- 💬 **Comments** - Nested comments with edit/delete functionality
- ❤️ **Interactions** - Like, bookmark, and share posts
- 👥 **Social** - Follow/unfollow users, private accounts
- 📖 **Stories** - 24-hour ephemeral content with story replies
- 💌 **Messages** - Direct messaging with post/story sharing
- 🔔 **Notifications** - Real-time updates for interactions
- #️⃣ **Hashtags** - Discover content by tags
- 🔍 **Explore** - Trending posts and user discovery
- 🚫 **Moderation** - Block users and report content

### Design
- 🎨 Rose-themed dark UI with gradient accents
- 📱 Fully responsive design
- ⚡ Smooth animations and transitions
- 🌙 Dark mode optimized
- ✨ Glassmorphism effects

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **SMTP** - Email service

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (v4.4+)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pixora-social-media
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Configure Backend Environment**
   
   Copy the example file and update with your credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` and update:
   ```env
   # MongoDB
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=pixora_social_app
   
   # JWT - Generate a secure secret key
   SECRET_KEY=your-secure-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # SMTP (Optional - for password reset emails)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=Pixora
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Configure Frontend Environment**
   
   Copy the example file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   
   The default configuration should work:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### Running the Application

1. **Start MongoDB**
   ```bash
   mongod
   ```

2. **Start Backend** (in backend directory)
   ```bash
   # Windows
   venv\Scripts\python main.py
   
   # Mac/Linux
   python main.py
   ```
   Backend runs on: http://localhost:8000

3. **Start Frontend** (in frontend directory)
   ```bash
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

## 📁 Project Structure

```
pixora-social-media/
├── backend/
│   ├── app/
│   │   ├── analytics/      # Analytics endpoints
│   │   ├── auth/           # Authentication
│   │   ├── comments/       # Comments management
│   │   ├── hashtags/       # Hashtag features
│   │   ├── messages/       # Direct messaging
│   │   ├── moderation/     # Block/report features
│   │   ├── notifications/  # Notification system
│   │   ├── posts/          # Post management
│   │   ├── stories/        # Stories feature
│   │   ├── users/          # User management
│   │   ├── database.py     # MongoDB connection
│   │   └── models.py       # Data models
│   ├── main.py             # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # CSS files
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 🎨 Design System

### Colors
- **Background**: `#0a0708`, `#130f10`
- **Rose Gradient**: `#e93e68` → `#f45d7d`
- **Text**: White with opacity variants (100%, 70%, 40%, 20%)
- **Borders**: White with 5-10% opacity

### Components
- Rose gradient buttons with glow effects
- Dark glassmorphism cards
- Smooth hover animations
- Rounded corners (2rem-3rem)

## 🔑 Getting Started

After setting up the project, create your first account through the registration page. All features including authentication, posts, comments, stories, and messaging will be available immediately.

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Rose theme design inspiration
- Lucide Icons for beautiful icons
- FastAPI and React communities

---

**Built with ❤️ and 🌹 by the Pixora team**
