const mongoose = require("mongoose");

console.log("Defining User model schema....");

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  phoneNumber: {
    type: String,
    default: "",
  },
  profile: {
    dateOfBirth: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: "",
    },
    profilePictureUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user", "manager", "super-admin"],
      default: "user",
      required: false,
    },
    timezone: {
      type: String,
      default: "America/New_York",
      validate: {
        validator: function(v) {
          return Intl.supportedValuesOf('timeZone').includes(v);
        },
        message: props => `${props.value} is not a valid timezone!`
      }
    }
  },
  marketingBudget: {
    adBudget: {
      type: Number,
      default: 0,
    },
    costPerAcquisition: {
      type: Number,
      default: 0,
    },
    dailySpendingLimit: {
      type: Number,
      default: 0,
    },
    marketingChannels: {
      type: String,
      default: "",
    },
    monthlyBudget: {
      type: Number,
      default: 0,
    },
    preferredPlatforms: {
      type: String,
      default: "",
    },
    notificationPreferences: {
      type: [String],
      default: [],
    },
    roiTarget: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: String,
      enum: ["daily", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
  },
  address: {
    street: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    zipCode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  collection: "users",
});

// Add any pre/post hooks if needed
userSchema.pre("save", function (next) {
  console.log("Pre-save hook triggered for user:", this.auth0Id);
  next();
});

// Create and export the model
const User = mongoose.model("User", userSchema);
console.log("User model compiled successfully");

module.exports = User;
