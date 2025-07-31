const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller.js");

router.post("/login", userController.loginUser);
router.post("/register", userController.createUser);
router.get("/:id", userController.getUserById);
router.put("/updateProfile", userController.updateUserProfile);

// ✅ Admin Routes
router.get("/", userController.getAllUsers); // Get all users
router.put("/:id/role", userController.updateUserRole); // Update role
router.delete("/:id", userController.deleteUser); // Delete user

module.exports = router;
