const ScheduledEvent = require("../models/scheduledEvent"); // Ensure your MongoDB model is properly set up
const User = require("../models/user"); // Import User model

// 🔹 Get all scheduled events
const getAllScheduledEvents = async (req, res) => {
  try {
    const events = await ScheduledEvent.find({}).lean(); // Use .lean() for better performance

    // Collect all unique user emails from selectedUsers across all events
    const allUserEmails = events.reduce((acc, event) => {
      event.selectedUsers.forEach(user => {
        if (user.email) {
          acc.add(user.email);
        }
      });
      return acc;
    }, new Set());

    // Fetch user details for all collected emails
    const users = await User.find({ email: { $in: Array.from(allUserEmails) } }).select('email firstName lastName').lean();

    // Create a map of email to user details for quick lookup
    const userDetailsMap = users.reduce((acc, user) => {
      acc[user.email] = { firstName: user.firstName, lastName: user.lastName };
      return acc;
    }, {});

    // Enrich the selectedUsers array in each event with user details
    const enrichedEvents = events.map(event => {
      const enrichedSelectedUsers = event.selectedUsers.map(user => {
        const details = userDetailsMap[user.email] || {}; // Get details or empty object if not found
        return {
          ...user,
          firstName: details.firstName,
          lastName: details.lastName
        };
      });
      return {
        ...event,
        selectedUsers: enrichedSelectedUsers
      };
    });

    res.status(200).json(enrichedEvents);
  } catch (error) {
    console.error("Error fetching scheduled events:", error);
    res.status(500).json({ message: "Error retrieving scheduled events" });
  }
};

// 🔹 Get scheduled events for a specific user
const getUserScheduledEvents = async (req, res) => {
  const { id } = req.params;
  try {
    const userEvents = await ScheduledEvent.find({ userId: id });

    if (!userEvents.length) {
      return res.status(204).json({ message: "No scheduled events found for this user" });
    }

    res.status(200).json(userEvents);
  } catch (error) {
    console.error(`Error fetching events for user ${id}:`, error);
    res.status(500).json({ message: "Error retrieving user scheduled events" });
  }
};

module.exports = {
  getAllScheduledEvents,
  getUserScheduledEvents,
};
