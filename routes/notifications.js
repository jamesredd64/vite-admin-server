const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');

// Define the notification schema
const notificationSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    index: true // Add an index for better query performance
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['all', 'selected'], 
    default: 'all' 
  },
  recipients: [{ type: String }],
  senderProfilePic: { type: String }, // Add this field
  read: [{
    userId: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
notificationSchema.index({ auth0Id: 1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    console.log('Attempting to mark notification as read:', req.params.id);
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      console.log('Notification not found:', req.params.id);
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    // Get userId from request body or auth token
    const userId = req.body.userId || req.user?.sub;
    
    if (!userId) {
      console.log('No userId found in request');
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'userId is required' 
      });
    }

    // Check if already read
    if (!notification.read.some(r => r.userId === userId)) {
      notification.read.push({ userId, readAt: new Date() });
      await notification.save();
      console.log(`Notification ${req.params.id} marked as read by user ${userId}`);
    }

    res.json(notification);
  } catch (error) {
    console.error('Error in mark as read route:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

router.get('/:userId/unread', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    console.log('🔍 Fetching unread notifications for user:', userId);

    const queryConditions = {
      $or: [
        { recipients: userId },
        { type: 'all' }
      ],
      'read': {
        $not: {
          $elemMatch: { userId: userId }
        }
      }
    };

    console.log('📋 Query conditions:', JSON.stringify(queryConditions, null, 2));

    const notifications = await Notification.find(queryConditions)
      .sort({ createdAt: -1 });

    console.log('✅ Unread notifications found:', notifications.length);
    console.log('📊 Notifications summary:', notifications.map(n => ({
      _id: n._id,
      title: n.title,
      createdBy: n.createdBy,
      createdAt: n.createdAt
    })));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Get all notifications for a user (read and unread)
router.get('/user/:userId/all', async (req, res) => {
  try {
    const userId = decodeURIComponent(req.params.userId);
    console.log('🔍 Fetching all notifications for user:', userId);
    
    const queryConditions = {
      recipients: userId
    };
    
    console.log('📋 Query conditions:', JSON.stringify(queryConditions, null, 2));

    const notifications = await Notification.find(queryConditions)
      .sort({ createdAt: -1 });

    console.log('✅ Total notifications found:', notifications.length);
    console.log('📊 Notifications summary:', notifications.map(n => ({
      _id: n._id,
      title: n.title,
      createdBy: n.createdBy,
      createdAt: n.createdAt,
      isRead: n.read.some(r => r.userId === userId)
    })));

    res.json(notifications);
  } catch (error) {
    console.error('❌ Error fetching all notifications:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Admin route to get all notifications (requires admin middleware)
router.get('/admin/all', async (req, res) => {
  try {
    console.log('🔍 Admin fetching all notifications');

    const notifications = await Notification.find({})
      .sort({ createdAt: -1 });

    console.log('✅ Total notifications found:', notifications.length);
    console.log('📊 Notifications summary:', notifications.map(n => ({
      _id: n._id,
      title: n.title,
      createdBy: n.createdBy,
      createdAt: n.createdAt,
      recipientCount: n.recipients.length
    })));

    res.json(notifications);
  } catch (error) {
    console.error('❌ Error fetching admin notifications:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Get all notifications route
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all notifications');
    const notifications = await Notification.find({});
    console.log(`Found ${notifications.length} notifications`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Get a single notification by MongoDB _id
router.get('/id/:id', async (req, res) => {
  try {
    // Validate if the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: 'Invalid ID',
        message: 'The provided ID is not a valid MongoDB ObjectId' 
      });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Notification not found' 
      });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { title, message, type, recipients, auth0Id } = req.body;
    
    if (!auth0Id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'auth0Id is required'
      });
    }

    // Verify the user exists before creating the notification
    const user = await User.findOne({ auth0Id });
    if (!user) {
      console.log('User not found for auth0Id:', auth0Id);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User not found'
      });
    }

    console.log('Creating notification:', {
      auth0Id,
      title,
      message,
      type,
      recipientsCount: recipients?.length,
      createdBy: auth0Id  // Log this explicitly
    });

    const notification = new Notification({
      auth0Id,
      title,
      message,
      type,
      recipients: recipients || [],
      senderProfilePic: req.body.senderProfilePic, // Add this line
      createdBy: auth0Id  // Make sure this matches the user's auth0Id
    });

    await notification.save();
    console.log('Notification created successfully:', {
      _id: notification._id,
      createdBy: notification.createdBy
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Get notifications by auth0Id(s)
router.get('/:auth0Id', async (req, res) => {
  try {
    const auth0Ids = decodeURIComponent(req.params.auth0Id).split(',');
    console.log('Fetching notifications for auth0Ids:', auth0Ids);
    
    const notifications = await Notification.find({ 
      auth0Id: { $in: auth0Ids } 
    }).sort({ createdAt: -1 });
    
    if (notifications.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'No notifications found' 
      });
    }

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications by auth0Id:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

module.exports = router;
