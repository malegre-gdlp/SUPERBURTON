const express = require('express');
const router = express.Router();
const economyEngine = require('../services/EconomyEngine');

// Get current events
router.get('/', async (req, res) => {
  try {
    const activeEvents = economyEngine.getActiveEvents();
    const calendar = economyEngine.eventCalendar;

    res.json({
      active: activeEvents,
      upcoming: calendar.filter(e => {
        const now = new Date();
        const start = new Date(now.getFullYear(), e.startMonth - 1, e.startDay);
        return start > now;
      }),
      all: calendar
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
