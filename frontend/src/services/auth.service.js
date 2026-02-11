import api from '../config/api';

// Forgot password
export async function forgotPassword(email) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    throw error;
  }
}