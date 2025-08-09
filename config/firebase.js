const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
let app;
let db;
let auth;

try {
  // Initialize with service account (for server-side)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else {
    // Initialize with default credentials (for local development)
    app = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }

  db = getFirestore(app);
  auth = getAuth(app);

  console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  process.exit(1);
}

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  USER_PROFILES: 'userProfiles',
  EMAIL_VERIFICATION: 'emailVerification',
  PASSWORD_RESET: 'passwordReset'
};

// Helper functions for Firestore operations
const firestoreHelpers = {
  // Create a new document
  async createDocument(collection, id, data) {
    try {
      const docRef = db.collection(collection).doc(id);
      await docRef.set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id, ...data };
    } catch (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }
  },

  // Get a document by ID
  async getDocument(collection, id) {
    try {
      const doc = await db.collection(collection).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Failed to get document: ${error.message}`);
    }
  },

  // Update a document
  async updateDocument(collection, id, data) {
    try {
      const docRef = db.collection(collection).doc(id);
      await docRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  },

  // Delete a document
  async deleteDocument(collection, id) {
    try {
      await db.collection(collection).doc(id).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },

  // Query documents
  async queryDocuments(collection, field, operator, value) {
    try {
      const snapshot = await db.collection(collection)
        .where(field, operator, value)
        .get();
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Failed to query documents: ${error.message}`);
    }
  },

  // Get all documents in a collection with pagination
  async getAllDocuments(collection, limit = 20, offset = 0) {
    try {
      let query = db.collection(collection);
      
      if (offset > 0) {
        query = query.offset(offset);
      }
      
      if (limit > 0) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }
};

// User management functions
const userHelpers = {
  // Create user with Firebase Auth
  async createUser(email, password, userData) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: false
      });

      // Store additional user data in Firestore
      await firestoreHelpers.createDocument(COLLECTIONS.USER_PROFILES, userRecord.uid, {
        email: email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        language: userData.language || 'en',
        preferences: userData.preferences || {
          theme: 'dark',
          notifications: { email: true, updates: true }
        },
        role: 'user',
        emailVerified: false
      });

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        ...userData
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  // Get user by ID
  async getUserById(uid) {
    try {
      const [authUser, profileData] = await Promise.all([
        auth.getUser(uid),
        firestoreHelpers.getDocument(COLLECTIONS.USER_PROFILES, uid)
      ]);

      return {
        uid: authUser.uid,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        ...profileData
      };
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const authUser = await auth.getUserByEmail(email);
      const profileData = await firestoreHelpers.getDocument(COLLECTIONS.USER_PROFILES, authUser.uid);

      return {
        uid: authUser.uid,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        ...profileData
      };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  },

  // Update user profile
  async updateUserProfile(uid, updateData) {
    try {
      const updates = {};
      
      // Update Firebase Auth if needed
      if (updateData.email || updateData.displayName) {
        const authUpdates = {};
        if (updateData.email) authUpdates.email = updateData.email;
        if (updateData.firstName || updateData.lastName) {
          authUpdates.displayName = `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
        }
        await auth.updateUser(uid, authUpdates);
      }

      // Update Firestore profile
      await firestoreHelpers.updateDocument(COLLECTIONS.USER_PROFILES, uid, updateData);

      return true;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  },

  // Delete user
  async deleteUser(uid) {
    try {
      // Delete from Firebase Auth
      await auth.deleteUser(uid);
      
      // Delete from Firestore
      await firestoreHelpers.deleteDocument(COLLECTIONS.USER_PROFILES, uid);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  // Verify custom token
  async verifyToken(idToken) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }
};

module.exports = {
  admin,
  db,
  auth,
  firestoreHelpers,
  userHelpers,
  COLLECTIONS
};
