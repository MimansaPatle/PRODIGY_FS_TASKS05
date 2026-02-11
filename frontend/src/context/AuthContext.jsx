import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        
        // Migrate old format: if user has _id but not id, add id field
        if (user._id && !user.id) {
          user.id = user._id;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        setCurrentUser({ uid: user.id || user._id }); // For compatibility
        setUserProfile(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const register = async (email, password, username, displayName) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        username,
        displayName
      });
      
      // Don't auto-login after registration
      // Just return success - user will need to login manually
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      const { user, access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser({ uid: user.id });
      setUserProfile(user);
      
      return { user: { uid: user.id } };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      
      // Extract error message
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserProfile(null);
    return Promise.resolve();
  };

  const updateUserProfile = async (updates) => {
    try {
      const response = await api.put('/users/me', updates);
      const updatedUser = response.data;
      
      // Ensure id field exists (migrate from _id if needed)
      if (updatedUser._id && !updatedUser.id) {
        updatedUser.id = updatedUser._id;
      }
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserProfile(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.detail || 'Profile update failed');
    }
  };

  const value = {
    currentUser,
    userProfile,
    register,
    login,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};