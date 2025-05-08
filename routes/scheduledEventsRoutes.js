const express = require("express");
const { getAllScheduledEvents, getUserScheduledEvents } = require("../controllers/scheduledEvents.controller");

const router = express.Router();

// 🔹 Route to get ALL scheduled events
router.get("/events", getAllScheduledEvents);

// 🔹 Route to get scheduled events for a specific user
router.get("/events/:id", getUserScheduledEvents);

module.exports = router;
