const ScheduledEvent = require("../models/scheduledEvent"); // Ensure your MongoDB model is properly set up

// 🔹 Get all scheduled events
const getAllScheduledEvents = async (req, res) => {
  try {
    const events = await ScheduledEvent.find({});
    res.status(200).json(events);
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
