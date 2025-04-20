const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

router.get("/", eventController.getAllEvents);
router.get("/getEventsByTags", eventController.getEventsByTags);

module.exports = router;
