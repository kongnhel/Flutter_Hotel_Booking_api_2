const { db } = require("../firebase");
const { v4: uuidv4 } = require("uuid");

// Helper function to validate YYYY-MM-DD date string
const isValidYYYYMMDD = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return false;
  // Regex for YYYY-MM-DD format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const d = new Date(dateStr);
  // Check if the date is valid and the year/month/day match to avoid invalid dates like '2023-02-30'
  // Also check if the date object is 'Invalid Date'
  return (
    d.toString() !== "Invalid Date" &&
    d.getFullYear() === parseInt(dateStr.substring(0, 4), 10) &&
    d.getMonth() + 1 === parseInt(dateStr.substring(5, 7), 10) &&
    d.getDate() === parseInt(dateStr.substring(8, 10), 10)
  );
};

// ✅ Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      roomId,
      roomName,
      roomTypeId,
      totalPrice,
      checkInDate,
      checkOutDate,
      guests,
      paymentMethod,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!userId) missingFields.push("userId");
    if (!roomId) missingFields.push("roomId");
    if (totalPrice === undefined || totalPrice === null)
      missingFields.push("totalPrice"); // Check for undefined/null
    if (!checkInDate) missingFields.push("checkInDate");
    if (!checkOutDate) missingFields.push("checkOutDate");
    if (guests === undefined || guests === null) missingFields.push("guests"); // Check for undefined/null
    if (!paymentMethod) missingFields.push("paymentMethod");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missing: missingFields,
      });
    }

    // Validate date formats (YYYY-MM-DD string)
    if (!isValidYYYYMMDD(checkInDate)) {
      return res
        .status(400)
        .json({ error: "Invalid checkInDate format. Must be YYYY-MM-DD." });
    }
    if (!isValidYYYYMMDD(checkOutDate)) {
      return res
        .status(400)
        .json({ error: "Invalid checkOutDate format. Must be YYYY-MM-DD." });
    }

    // Check room exists and is not booked
    const roomDoc = await db.collection("rooms").doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: "Room not found" });
    }
    // Check if the room is already booked before proceeding
    if (roomDoc.data().isBooked === true) {
      return res.status(400).json({ error: "Room already booked" });
    }

    // Validate totalPrice
    if (typeof totalPrice !== "number" && typeof totalPrice !== "string") {
      return res.status(400).json({
        error:
          "Invalid totalPrice type. Must be a number or string convertible to number.",
      });
    }
    const parsedTotalPrice = parseFloat(totalPrice);
    if (isNaN(parsedTotalPrice) || parsedTotalPrice < 0) {
      // Ensure price is non-negative
      return res.status(400).json({
        error: "Invalid totalPrice value. Must be a non-negative number.",
      });
    }

    // Validate guests
    if (typeof guests !== "number" && typeof guests !== "string") {
      return res.status(400).json({
        error:
          "Invalid guests type. Must be a number or string convertible to number.",
      });
    }
    const parsedGuests = parseInt(guests, 10);
    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid guests value. Must be a positive number." });
    }

    // Mark room as booked BEFORE creating the order to prevent double-booking race conditions
    // In a real-world scenario, you might use Firestore transactions for atomicity.
    await db.collection("rooms").doc(roomId).update({
      isBooked: true,
    });

    const orderId = uuidv4();
    const orderData = {
      id: orderId,
      userId,
      roomId,
      roomName: roomName || "", // Provide default empty string if not provided
      roomTypeId: roomTypeId || null, // Provide default null if not provided
      totalPrice: parsedTotalPrice,
      checkInDate,
      checkOutDate,
      guests: parsedGuests,
      paymentMethod,
      status: "pending", // Initial status
      createdAt: new Date().toISOString(), // Store as ISO string
    };

    await db.collection("orders").doc(orderId).set(orderData);
    res
      .status(201)
      .json({ message: "Order created successfully", order: orderData });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    // If an error occurs after marking the room as booked but before order creation,
    // you might need to revert the room status. This is where transactions are useful.
    res.status(500).json({ error: "Failed to create order" });
  }
};

// ✅ Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// ✅ Get orders by userId
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No orders found for this user" });
    }

    const orders = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(orders);
  } catch (error) {
    console.error("Get Orders By User Error:", error.message);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
};

// ✅ Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Order ID parameter is required" });
    }

    const doc = await db.collection("orders").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error("Get Order By ID Error:", error.message);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// ✅ Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID parameter is required" });
    }
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const allowedStatuses = ["pending", "confirmed", "canceled", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value provided." });
    }

    const orderRef = db.collection("orders").doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentOrderData = orderDoc.data();
    const roomId = currentOrderData.roomId;

    // Update the order status
    await orderRef.update({ status });

    // Logic to update the room's isBooked status based on order status
    if (roomId) {
      if (status === "canceled" || status === "completed") {
        // If order is canceled or completed, mark the room as not booked
        await db.collection("rooms").doc(roomId).update({
          isBooked: false,
        });
      } else if (status === "confirmed") {
        // If order is confirmed, ensure the room is marked as booked
        await db.collection("rooms").doc(roomId).update({
          isBooked: true,
        });
      }
      // For 'pending' status, assume isBooked remains true if it was set during creation.
      // If you want to revert to false for pending, you'd need more complex logic
      // to handle cases where pending might mean temporarily reserved.
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// ✅ Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Order ID parameter is required" });
    }

    const orderDoc = await db.collection("orders").doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { roomId } = orderDoc.data();

    // Delete the order
    await db.collection("orders").doc(id).delete();

    // If the order had an associated room, free up the room
    if (roomId) {
      // Check if the room actually exists before trying to update it
      const roomRef = db.collection("rooms").doc(roomId);
      const roomCheck = await roomRef.get();
      if (roomCheck.exists) {
        await roomRef.update({
          isBooked: false,
        });
      } else {
        console.warn(
          `Room with ID ${roomId} not found when deleting order ${id}.`
        );
      }
    }

    res
      .status(200)
      .json({ message: "Order deleted and room freed successfully" });
  } catch (error) {
    console.error("Delete Order Error:", error.message);
    res.status(500).json({ error: "Failed to delete order" });
  }
};
