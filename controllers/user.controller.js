const mongoose = require("mongoose");
const User = require("../models/user.js");
const sanitizeHtml = require('sanitize-html');

// Ensure model initialization
const initializeUserModel = () => {
  // Check if model exists
  if (!mongoose.models.User) {
    console.log("Initializing User model...");
    // If model doesn't exist, require it again to ensure initialization
    require("../models/user.js");
  }

  // Validate model schema
  const userSchema = mongoose.models.User.schema;
  const requiredPaths = ["auth0Id", "email", "marketingBudget", "address"];

  requiredPaths.forEach((path) => {
    if (!userSchema.path(path) && !userSchema.nested[path]) {
      throw new Error(`Required path '${path}' missing in User schema`);
    }
  });

  // Initialize indexes
  return Promise.all([
    mongoose.models.User.collection.createIndex(
      { auth0Id: 1 },
      { unique: true }
    ),
    mongoose.models.User.collection.createIndex({ email: 1 }, { unique: true }),
  ]).catch((err) => {
    console.error("Error creating indexes:", err);
    throw err;
  });
};

// Initialize model and indexes before exposing controller methods
initializeUserModel()
  .then(() => {
    console.log("User model initialized successfully");
  })
  .catch((err) => {
    console.error("Failed to initialize User model:", err);
    process.exit(1);
  });

// Submit user form
const submitUserForm = async (req, res) => {
  try {
    const { email, message } = req.body;
    const sanitizedMessage = sanitizeHtml(message);

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, formSubmissions: [{ message: sanitizedMessage, submittedAt: new Date() }] });
      await user.save();
    } else {
      user.formSubmissions.push({ message: sanitizedMessage, submittedAt: new Date() });
      await user.save();
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Find a user by Auth0 ID
const findByAuth0Id = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const user = await User.findOne({ auth0Id: decodeURIComponent(auth0Id) });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error finding user:", err);
    res.status(500).json({ message: "Error retrieving user", error: err.message });
  }
};

// Create a new user
const create = async (req, res) => {
  try {
    const { auth0Id, email, firstName, lastName } = req.body;

    if (!auth0Id || !email) {
      return res.status(400).json({ message: "Both auth0Id and email are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const user = new User({ auth0Id, email, firstName, lastName });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: err.message });
  }
};

// Retrieve all users
const findAll = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Find a single User with id
findOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        message: `User not found with id ${req.params.id}`,
      });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Error retrieving user with id " + req.params.id,
    });
  }
};

getUserProfileByAuth0Id = async (req, res) => {
  try {
    // Extract the auth0Id from request parameters
    const { auth0Id } = req.params;

    // Find the user based on auth0Id
    const user = await User.findOne({ auth0Id });

    // If no user is found, return a 404 error
    if (!user) {
      return res.status(404).json({
        message: `User not found with auth0Id ${auth0Id}`,
      });
    }

    // Return the profile information
    res.status(200).json(user.profile);
  } catch (err) {
    // Handle errors and return a 500 error
    res.status(500).json({
      message: err.message || `Error retrieving user profile with auth0Id ${req.params.auth0Id}`,
    });
  }
};


// Update user by auth0Id (Consolidated update function)
const updateUser = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const updates = req.body;

    console.log("Controller: Updating user:", auth0Id);
    console.log("Update data received:", JSON.stringify(updates, null, 2));

    // Use $set to apply updates. Mongoose will handle nested paths.
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updates },
      {
        new: true,
        runValidators: true,
        // Consider using upsert: true if you want to create the user if not found
        // upsert: true
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Updated user:", JSON.stringify(updatedUser, null, 2));
    res.json(updatedUser);
  } catch (err) {
    console.error("Error in updateUser:", err);
    res.status(500).json({
      message: "Error updating user",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Delete a User with id
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: `Cannot delete User with id=${req.params.id}. User not found!`,
      });
    }

    res.status(200).json({
      message: "User was deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Could not delete User with id=" + req.params.id,
    });
  }
};

// Delete all Users
const deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.status(200).json({
      message: `${result.deletedCount} Users were deleted successfully!`,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while removing all users.",
    });
  }
};

// Create or update a User
const createOrUpdateUser = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Construct the update data carefully, using dot notation for nested fields
    // This ensures that only provided fields are updated and validators run correctly.
    const updateData = {};
    if (req.body.auth0Id !== undefined) updateData.auth0Id = req.body.auth0Id;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
    if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    // Handle nested profile fields
    if (req.body.profile) {
      if (req.body.profile.dateOfBirth !== undefined) updateData['profile.dateOfBirth'] = req.body.profile.dateOfBirth;
      if (req.body.profile.profilePictureUrl !== undefined) updateData['profile.profilePictureUrl'] = req.body.profile.profilePictureUrl;
      // Set default role if not provided
      updateData['profile.role'] = req.body.profile.role !== undefined ? req.body.profile.role : "user";
      if (req.body.profile.timezone !== undefined) updateData['profile.timezone'] = req.body.profile.timezone;
      if (req.body.profile.gender !== undefined) updateData['profile.gender'] = req.body.profile.gender;
    } else {
       // If profile object is not provided, ensure role still defaults if needed
       // This might depend on schema defaults, but explicit handling is safer
       const existingUser = await User.findOne({ email: req.body.email });
       if (existingUser && existingUser.profile && existingUser.profile.role === undefined) {
           updateData['profile.role'] = "user";
       } else if (!existingUser) {
           updateData['profile.role'] = "user";
       }
    }


    // Handle nested marketingBudget fields
    if (req.body.marketingBudget) {
      if (req.body.marketingBudget.frequency !== undefined) updateData['marketingBudget.frequency'] = req.body.marketingBudget.frequency;
      if (req.body.marketingBudget.adBudget !== undefined) updateData['marketingBudget.adBudget'] = req.body.marketingBudget.adBudget;
      if (req.body.marketingBudget.costPerAcquisition !== undefined) updateData['marketingBudget.costPerAcquisition'] = req.body.marketingBudget.costPerAcquisition;
      if (req.body.marketingBudget.dailySpendingLimit !== undefined) updateData['marketingBudget.dailySpendingLimit'] = req.body.marketingBudget.dailySpendingLimit;
      if (req.body.marketingBudget.marketingChannels !== undefined) updateData['marketingBudget.marketingChannels'] = req.body.marketingBudget.marketingChannels;
      if (req.body.marketingBudget.monthlyBudget !== undefined) updateData['marketingBudget.monthlyBudget'] = req.body.marketingBudget.monthlyBudget;
      if (req.body.marketingBudget.preferredPlatforms !== undefined) updateData['marketingBudget.preferredPlatforms'] = req.body.marketingBudget.preferredPlatforms;
      if (req.body.marketingBudget.notificationPreferences !== undefined) updateData['marketingBudget.notificationPreferences'] = req.body.marketingBudget.notificationPreferences;
      if (req.body.marketingBudget.roiTarget !== undefined) updateData['marketingBudget.roiTarget'] = req.body.marketingBudget.roiTarget;
    }

    // Handle nested address fields
    if (req.body.address) {
      if (req.body.address.street !== undefined) updateData['address.street'] = req.body.address.street;
      if (req.body.address.city !== undefined) updateData['address.city'] = req.body.address.city;
      if (req.body.address.state !== undefined) updateData['address.state'] = req.body.address.state;
      if (req.body.address.zipCode !== undefined) updateData['address.zipCode'] = req.body.address.zipCode;
      if (req.body.address.country !== undefined) updateData['address.country'] = req.body.address.country;
    }


    const filter = { email: req.body.email };
    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    // Use the constructed updateData object with $set
    const user = await User.findOneAndUpdate(filter, { $set: updateData }, options);
    res.status(200).json(user);
  } catch (err) {
    console.error("Error in createOrUpdateUser:", err);
    res.status(500).json({
      message: err.message || "Some error occurred while saving the User.",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};


// Consolidate module exports
module.exports = {
  findByAuth0Id,
  create,
  submitUserForm,
  findOne,
  getUserProfileByAuth0Id,
  updateUser, // Export the new consolidated update function
  deleteUserById, // Export the renamed delete function
  deleteAllUsers, // Export the renamed deleteAll function
  createOrUpdateUser, // Export the renamed createOrUpdate function
  findAll
};
