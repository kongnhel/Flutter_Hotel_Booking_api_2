const express = require("express");
const app = express();
const cors = require("cors");

const userRoutes = require("./routes/user.routes.js");
const roomRoutes = require("./routes/room.routes.js");
const roomTypeRoute = require("./routes/roomType.routes.js");
const orderRoutes = require("./routes/order.routes.js");

// ✅ Middleware
app.use(cors());
app.use(express.json());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/room_types", roomTypeRoute);
app.use("/api/orders", orderRoutes);

// ✅ Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
