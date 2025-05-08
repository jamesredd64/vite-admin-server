const mongoose = require("mongoose");
const User = require("../models/user.js");

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

// Controller methods
exports.findByAuth0Id = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const decodedAuth0Id = decodeURIComponent(auth0Id);
    console.log(
      "Controller: Searching for user with decoded auth0Id:",
      decodedAuth0Id
    );

    const user = await User.findOne({ auth0Id: decodedAuth0Id });
    console.log("Controller: MongoDB query result:", user);

    if (!user) {
      console.log("Controller: No user found for auth0Id:", decodedAuth0Id);
      return res.status(204).send();
    }

    res.json(user);
  } catch (err) {
    console.error("Controller: Error finding user:", err);
    res.status(500).json({
      message: "Error retrieving user",
      error: err.message,
    });
  }
};

// Create a new User
exports.create = async (req, res) => {
  try {
    console.log("Creating new user with data:", req.body);

    const user = new User(req.body);
    const savedUser = await user.save();

    console.log("User created successfully:", savedUser);
    res.status(201).json(savedUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      message: err.message || "Some error occurred while creating the User.",
      error: err.toString(),
    });
  }
};

// Retrieve all Users
exports.findAll = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
};

// Find a single User with id
exports.findOne = async (req, res) => {
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

exports.getUserProfileByAuth0Id = async (req, res) => {
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


// Update user by auth0Id
exports.update = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const { section } = req.query;
    const updates = req.body;

    console.log("Controller: Updating user:", auth0Id);
    console.log("Section:", section);
    console.log("Update data received:", JSON.stringify(updates, null, 2));

    // Find the existing user
    const existingUser = await User.findOne({ auth0Id });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

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

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateQuery },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      throw new Error("Update failed - user not found after update");
    }

    console.log("Updated user:", JSON.stringify(updatedUser, null, 2));
    res.json(updatedUser);
  } catch (err) {
    console.error("Error in update:", err);
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Delete a User with id
exports.delete = async (req, res) => {
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
exports.deleteAll = async (req, res) => {
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
exports.createOrUpdate = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const userData = {
      auth0Id: req.body["auth0Id"],
      email: req.body["email"],
      firstName: req.body["firstName"],
      lastName: req.body["lastName"],
      phoneNumber: req.body["phoneNumber"],
      profile: {
        dateOfBirth: req.body["dateOfBirth"],
        profilePictureUrl: req.body["profilePictureUrl"],
        role: req.body["profile"] ? req.body["profile"]["role"] : "user",
        timezone: req.body["profile"] ? req.body["profile"]["timezone"] : "",
        gender: req.body["profile"] ? req.body["profile"]["gender"] : "",
      },
      marketingBudget: {
        frequency: req.body["marketingBudget"] ? req.body["marketingBudget"]["frequency"] : "monthly",
        adBudget: req.body["marketingBudget"] ? req.body["marketingBudget"]["adBudget"] : 0,
        costPerAcquisition: req.body["marketingBudget"] ? req.body["marketingBudget"]["costPerAcquisition"] : 0,
        dailySpendingLimit: req.body["marketingBudget"] ? req.body["marketingBudget"]["dailySpendingLimit"] : 0,
        marketingChannels: req.body["marketingBudget"] ? req.body["marketingBudget"]["marketingChannels"] : "",
        monthlyBudget: req.body["marketingBudget"] ? req.body["marketingBudget"]["monthlyBudget"] : 0,
        preferredPlatforms: req.body["marketingBudget"] ? req.body["marketingBudget"]["preferredPlatforms"] : "",
        notificationPreferences: req.body["marketingBudget"] ? req.body["marketingBudget"]["notificationPreferences"] : [],
        roiTarget: req.body["marketingBudget"] ? req.body["marketingBudget"]["roiTarget"] : 0
      },
      address: {
        street: req.body["address"] ? req.body["address"]["street"] : "",
        city: req.body["address"] ? req.body["address"]["city"] : "",
        state: req.body["address"] ? req.body["address"]["state"] : "",
        zipCode: req.body["address"] ? req.body["address"]["zipCode"] : "",
        country: req.body["address"] ? req.body["address"]["country"] : ""
      },
      isActive: req.body["isActive"] || false
    };

    const filter = { email: req.body.email };
    const update = { $set: userData };
    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    const user = await User.findOneAndUpdate(filter, update, options);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Some error occurred while saving the User.",
    });
  }
};

// Add this new controller method
exports.saveUserData = async (req, res) => {
  try {
    const { auth0Id } = req.params;
    const updateData = req.body;

    console.log("Controller: Saving user data for:", auth0Id);
    console.log("Update data received:", JSON.stringify(updateData, null, 2));

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User data saved successfully:", updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error("Controller: Error saving user data:", err);
    res.status(500).json({
      message: "Error saving user data",
      error: err.message,
    });
  }
};
