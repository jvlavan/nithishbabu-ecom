const express = require("express");

// Create a router
const router = express.Router();

// Import the userController module
const userController = require("../controllers/users");

// Define the register route
router.post('/register', userController.register);

// Define the login route
router.post('/login', userController.login);

// Export the router
module.exports = router;
