const express = require("express");
const router = express.Router();
const registerController = require("../controllers/waitlistConstroller");

router.post("/register", registerController.registerWaitlists);
module.exports = router;
