const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const userController = require('../controllers/user.controller.js');
 const { requireAuth, requireAdmin } = require('../middleware/auth');

// Add request logging
router.use((req, res, next) => {
  console.log('User Route:', req.method, req.url);
  next();
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get user by auth0Id
router.get('/:auth0Id', userController.findByAuth0Id);

// Create new user
router.post('/', async (req, res) => {
  try {
    const { auth0Id, email } = req.body;

    if (!auth0Id || !email) {
      return res.status(400).json({ 
        message: "Both auth0Id and email are required",
        receivedData: { auth0Id, email }
      });
    }

    // Check for existing user first
    const existingUser = await User.findOne({ $or: [{ email }, { auth0Id }] });

    // Ensure default profile with role and timezone is set
    const userData = {
      ...req.body,
      profile: {
        ...req.body.profile,
        role: existingUser?.profile?.role || req.body.profile?.role || 'user',
        timezone: req.body.profile?.timezone || 'America/New_York' // Ensure timezone has a default
      },
      isActive: true
    };

    // Use findOneAndUpdate to either update existing user or create new one
    const user = await User.findOneAndUpdate(
      { $or: [{ email }, { auth0Id }] },
      userData,
      { 
        new: true,           
        upsert: true,        
        runValidators: true, 
        setDefaultsOnInsert: true 
      }
    );

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ 
      message: "Error creating user",
      error: err.message
    });
  }
});

// Update user by auth0Id
router.put('/:auth0Id', async (req, res) => {
  const { auth0Id } = req.params;
  const { section } = req.query;
  const updates = req.body;

  try {
    let updateQuery = {};

    switch (section) {
      case 'meta':
        updateQuery = {
          email: updates.email,
          firstName: updates.firstName,
          lastName: updates.lastName,
          phoneNumber: updates.phoneNumber,
          profile: updates.profile
        };
        break;
      case 'address':
        updateQuery = { address: updates.address };
        break;
      case 'marketing':
        updateQuery = { marketingBudget: updates.marketingBudget };
        break;
      default:
        // If no section specified, update all fields
        updateQuery = updates;
    }

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateQuery },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save user data
router.put('/:auth0Id/save', userController.saveUserData);

// Add new lookup routes
router.get('/lookup', requireAuth, async (req, res) => {
  try {
    const users = await User.find(
      { isActive: true }, // Only get active users
      {
        auth0Id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        phoneNumber: 1,
        isActive: 1,
        'profile.dateOfBirth': 1,
        'profile.gender': 1,
        'profile.profilePictureUrl': 1,
        'profile.role': 1,
        'profile.timezone': 1,
        'marketingBudget': 1,
        'address': 1
      }
    ).lean(); // Use lean() for better performance
    
    res.json({
      success: true,
      data: users || []
    });
  } catch (err) {
    console.error('Error in user lookup:', err);
    res.status(500).json({ 
      success: false,
      data: [],
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get('/lookup/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    // Build search query
    const searchQuery = q ? {
      isActive: true,
      $or: [
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ]
    } : { isActive: true };

    // Execute search
    const users = await User.find(
      searchQuery,
      {
        auth0Id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        phoneNumber: 1,
        isActive: 1,
        'profile.dateOfBirth': 1,
        'profile.gender': 1,
        'profile.profilePictureUrl': 1,
        'profile.role': 1,
        'profile.timezone': 1,
        'marketingBudget': 1,
        'address': 1
      }
    ).lean();

    // Return results
    res.json({
      success: true,
      data: users || []
    });
  } catch (err) {
    console.error('Error in user search:', err);
    res.status(500).json({ 
      success: false,
      data: [],
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Define the route to get user profile
router.get("/users/:auth0Id/profile", userController.getUserProfileByAuth0Id);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const User = require('../models/user.js');
// const userController = require('../controllers/user.controller.js');

// // Get user by auth0Id
// router.get('/:auth0Id', userController.findByAuth0Id);

// // Create new user
// router.post('/', async (req, res) => {
//   try {
//     const { auth0Id, email } = req.body;

//     if (!auth0Id || !email) {
//       return res.status(400).json({ 
//         message: "Both auth0Id and email are required",
//         receivedData: { auth0Id, email }
//       });
//     }

//     // Use findOneAndUpdate to either update existing user or create new one
//     const user = await User.findOneAndUpdate(
//       { $or: [{ email }, { auth0Id }] },
//       req.body,
//       { 
//         new: true,           // Return the updated document
//         upsert: true,        // Create document if it doesn't exist
//         runValidators: true  // Run schema validators on update
//       }
//     );
    
//     const statusCode = user.createdAt === user.updatedAt ? 201 : 200;
//     res.status(statusCode).json(user);
//   } catch (err) {
//     console.error('Error creating/updating user:', err);
//     res.status(500).json({ 
//       message: err.message,
//       stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//     });
//   }
// });

// module.exports = router;














