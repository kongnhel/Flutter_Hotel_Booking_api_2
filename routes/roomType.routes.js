const express = require("express");
const router = express.Router();
const roomTypeController = require("../controllers/roomType.controller");

router.post("/", roomTypeController.createRoomType);
router.get("/", roomTypeController.getRoomTypes);
router.get("/:id", roomTypeController.getRoomTypeById);
module.exports = router;
