// Firebase-based API client for W.E.T Frontend
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './firebase-config.js';

class FirebaseWETApi {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.currentUser = null;
    this.authToken = null;
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        // Get fresh token
        user.getIdToken().then(token => {
          this.authToken = token;
          localStorage.setItem('wet_token', token);
        });
      } else {
        this.authToken = null;
        localStorage.removeItem('wet_token');
        localStorage.removeItem('wet_user');
      }
    });
  }

  // Get authentication headers
  async getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.currentUser) {
      try {
        const token = await this.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }
    
    return headers;
  }

  // Store user data
  setUser(user) {
    localStorage.setItem('wet_user', JSON.stringify(user));
  }

  // Get stored user data
  getUser() {
    const userData = localStorage.getItem('wet_user');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Register new user
  async register(userData) {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'userProfiles', user.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        language: userData.language || 'en',
        preferences: {
          theme: 'dark',
          notifications: { email: true, updates: true }
        },
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Send email verification
      await sendEmailVerification(user);

      // Store user data locally
      this.setUser({
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: user.emailVerified
      });

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailVerified: user.emailVerified
          }
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
      const profileData = profileDoc.exists() ? profileDoc.data() : {};

      const userData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...profileData
      };

      this.setUser(userData);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userData
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('wet_user');
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  // Send email verification
  async resendVerification() {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      await sendEmailVerification(this.currentUser);
      return {
        success: true,
        message: 'Verification email sent'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Send password reset email
  async forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      // Update Firebase Auth profile if needed
      if (profileData.displayName) {
        await updateProfile(this.currentUser, {
          displayName: profileData.displayName
        });
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'userProfiles', this.currentUser.uid), {
        ...profileData,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Change password
  async changePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      await updatePassword(this.currentUser, newPassword);
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const uid = this.currentUser.uid;
      
      // Delete user profile from Firestore
      await deleteDoc(doc(db, 'userProfiles', uid));
      
      // Delete user from Firebase Auth
      await deleteUser(this.currentUser);

      localStorage.removeItem('wet_user');

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Account deletion error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      if (!this.currentUser) {
        return {
          success: false,
          message: 'No user logged in'
        };
      }

      const profileDoc = await getDoc(doc(db, 'userProfiles', this.currentUser.uid));
      const profileData = profileDoc.exists() ? profileDoc.data() : {};

      const userData = {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        emailVerified: this.currentUser.emailVerified,
        ...profileData
      };

      return {
        success: true,
        data: { user: userData }
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Health check (for backend compatibility)
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, message: 'API unavailable' };
    }
  }

  // Get error message from Firebase error
  getErrorMessage(error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/requires-recent-login':
        return 'Please log in again to complete this action';
      default:
        return error.message || 'An error occurred';
    }
  }

  // Wait for auth to be ready
  async waitForAuth() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}

// Create global API instance
window.wetApi = new FirebaseWETApi();

// Export for ES6 modules
export default FirebaseWETApi;
