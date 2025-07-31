const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");

// ✅ Create new order
router.post("/", orderController.createOrder);

// ✅ Get all orders
router.get("/", orderController.getAllOrders);

// ✅ Get orders by userId
router.get("/user/:userId", orderController.getOrdersByUser);

// ✅ Get single order by ID
router.get("/:id", orderController.getOrderById);

// ✅ Update order status
router.put("/:id/status", orderController.updateOrderStatus);

// ✅ Delete order
router.delete("/:id", orderController.deleteOrder);

module.exports = router;
