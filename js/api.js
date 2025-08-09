// W.E.T Frontend API Client
class WETApi {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('wet_token');
    this.refreshToken = localStorage.getItem('wet_refresh_token');
  }

  // Set authentication headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Store tokens
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('wet_token', token);
    localStorage.setItem('wet_refresh_token', refreshToken);
  }

  // Clear tokens
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('wet_token');
    localStorage.removeItem('wet_refresh_token');
    localStorage.removeItem('wet_user');
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
    return !!this.token;
  }

  // Make API request with error handling
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.message === 'Token expired') {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers = this.getAuthHeaders();
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          this.clearTokens();
          window.location.href = '/index.html';
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error('Network error. Please check your connection.');
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();

      if (data.success) {
        this.setTokens(data.data.token, data.data.refreshToken);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  // Authentication methods
  async register(userData) {
    return await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(email, password) {
    return await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async verifyEmail(token) {
    return await this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  async resendVerification(email) {
    return await this.makeRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async forgotPassword(email) {
    return await this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, password) {
    return await this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }

  async getCurrentUser() {
    return await this.makeRequest('/auth/me');
  }

  // User profile methods
  async getUserProfile() {
    return await this.makeRequest('/user/profile');
  }

  async updateProfile(profileData) {
    return await this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(currentPassword, newPassword) {
    return await this.makeRequest('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async deleteAccount(password, confirmation) {
    return await this.makeRequest('/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation })
    });
  }

  // Admin methods
  async getUsers(page = 1, limit = 20, filters = {}) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    return await this.makeRequest(`/user/admin/users?${queryParams}`);
  }

  async updateUserRole(userId, role) {
    return await this.makeRequest(`/user/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }

  async getAdminStats() {
    return await this.makeRequest('/user/admin/stats');
  }

  // Utility methods
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, message: 'API unavailable' };
    }
  }

  // Handle API errors gracefully
  handleApiError(error, defaultMessage = 'An error occurred') {
    if (error.success === false) {
      return error.message || defaultMessage;
    }
    
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map(err => err.message).join(', ');
    }
    
    return error.message || defaultMessage;
  }

  // Display success/error messages
  showMessage(message, type = 'info', duration = 5000) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `api-message api-message-${type}`;
    messageEl.innerHTML = `
      <div class="api-message-content">
        <span class="api-message-text">${message}</span>
        <button class="api-message-close" onclick="this.parentElement.parentElement.remove()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(messageEl);

    // Auto remove after duration
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, duration);

    return messageEl;
  }
}

// Create global API instance
window.wetApi = new WETApi();

// Add CSS for API messages
const messageStyles = `
.api-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideIn 0.3s ease-out;
}

.api-message-info {
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.1), rgba(0, 200, 255, 0.1));
  border-color: rgba(88, 101, 242, 0.3);
  color: rgb(200, 210, 255);
}

.api-message-success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0, 200, 255, 0.1));
  border-color: rgba(34, 197, 94, 0.3);
  color: rgb(200, 255, 210);
}

.api-message-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(236, 72, 153, 0.1));
  border-color: rgba(239, 68, 68, 0.3);
  color: rgb(255, 200, 210);
}

.api-message-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(236, 72, 153, 0.1));
  border-color: rgba(245, 158, 11, 0.3);
  color: rgb(255, 240, 200);
}

.api-message-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.api-message-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.api-message-close {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.api-message-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .api-message {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}
`;

// Inject styles
if (!document.getElementById('api-message-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'api-message-styles';
  styleEl.textContent = messageStyles;
  document.head.appendChild(styleEl);
}
