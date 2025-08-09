# W.E.T Backend API

A comprehensive backend API for the W.E.T (Webcam Eye Tracking) application, featuring user authentication, email verification, and secure user management.

## 🚀 Features

### Authentication & Security
- **User Registration** with email verification
- **Secure Login** with JWT tokens and refresh tokens
- **Password Reset** via email
- **Account Lockout** protection against brute force attacks
- **Rate Limiting** for API endpoints
- **Role-based Access Control** (user, admin, premium)
- **Input Validation** and sanitization

### Email System
- **Automated Email Verification** for new accounts
- **Password Reset Emails** with secure tokens
- **Welcome Emails** after successful verification
- **Beautiful HTML Email Templates** matching the W.E.T design
- **Support for Multiple SMTP Providers** (Gmail, Outlook, SendGrid, etc.)

### User Management
- **User Profiles** with customizable preferences
- **Subscription Management** (free, premium, enterprise)
- **Language Support** (English/Turkish)
- **Theme Preferences** (light/dark)
- **Admin Dashboard** with user statistics

### Database
- **MongoDB** with Mongoose ODM
- **Comprehensive User Schema** with validation
- **Efficient Indexing** for performance
- **Secure Password Hashing** with bcrypt

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- SMTP email service (Gmail, Outlook, SendGrid, etc.)

## ⚙️ Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "eye track site"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Basic Configuration
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/wet-database
   
   # JWT Secrets (generate strong secrets!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   
   # Email Configuration (example for Gmail)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@wet-eyetracking.com
   ```

4. **Start MongoDB** (if using local installation)
   ```bash
   mongod
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The API will be available at `http://localhost:5000`

## 📧 Email Setup

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the app password in your `.env` file

### Other Email Providers
Check `env.example` for configuration examples for:
- Outlook/Hotmail
- SendGrid
- Mailgun
- Custom SMTP servers

## 🛡️ API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /verify-email` - Verify email address
- `POST /resend-verification` - Resend verification email
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /refresh-token` - Refresh access token
- `POST /logout` - User logout
- `GET /me` - Get current user info

### User Routes (`/api/user`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `DELETE /account` - Delete user account

### Admin Routes (`/api/user/admin`)
- `GET /users` - Get all users (paginated)
- `PUT /users/:id/role` - Update user role
- `GET /stats` - Get user statistics

### Health Check
- `GET /api/health` - API health status

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Optional validation errors
  ]
}
```

## 🔑 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived (7 days) for API requests
2. **Refresh Token**: Long-lived (30 days) for getting new access tokens

### Using the API
Include the access token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

## 👥 User Roles

- **user**: Standard user with basic features
- **premium**: Premium subscriber with enhanced features
- **admin**: Administrator with full access

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Account Lockout**: Automatic lockout after failed attempts
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive validation with Mongoose
- **CORS Protection**: Configurable cross-origin policies
- **Helmet**: Security headers for Express

## 📈 Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

### Project Structure
```
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── env.example            # Environment variables template
├── models/
│   └── User.js           # User database model
├── routes/
│   ├── auth.js           # Authentication routes
│   └── user.js           # User management routes
├── middleware/
│   └── auth.js           # Authentication middleware
├── services/
│   └── emailService.js   # Email service
└── README.md             # This file
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for MongoDB Atlas

2. **Email Not Sending**
   - Check email credentials in `.env`
   - Verify SMTP settings
   - Check spam folder for test emails
   - For Gmail, ensure App Password is used

3. **JWT Token Errors**
   - Ensure JWT secrets are set in `.env`
   - Check token expiration settings
   - Verify token format in requests

4. **Rate Limiting Issues**
   - Check rate limit settings
   - Clear rate limit cache if needed
   - Adjust limits for development

## 📝 Environment Variables Reference

See `env.example` for a complete list of configurable environment variables.

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support with the W.E.T backend API:
1. Check the troubleshooting section
2. Review the API documentation
3. Check environment configuration
4. Contact the development team

---

**W.E.T Backend API** - Powering the future of webcam eye tracking technology! 👁️✨
