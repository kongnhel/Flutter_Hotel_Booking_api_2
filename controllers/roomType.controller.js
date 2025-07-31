const admin = require("firebase-admin");

const { db } = require("../firebase");

// Create Room Type
exports.createRoomType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send({ error: "Room type name is required" });
    }

    const newType = await db.collection("room_types").add({ name });

    res.status(201).send({ id: newType.id, name });
  } catch (error) {
    console.error("Error creating room type:", error);
    res.status(500).send({ error: "Failed to create room type" });
  }
};

// Get All Room Types
exports.getRoomTypes = async (req, res) => {
  try {
    const snapshot = await db.collection("room_types").get();
    const roomTypes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).send(roomTypes);
  } catch (error) {
    console.error("Error getting room types:", error);
    res.status(500).send({ error: "Failed to fetch room types" });
  }
};

// Get Room Type by ID
exports.getRoomTypeById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await db.collection("room_types").doc(id).get();

    if (!doc.exists) {
      return res.status(404).send({ error: "Room type not found" });
    }

    res.status(200).send({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error getting room type by ID:", error);
    res.status(500).send({ error: "Failed to fetch room type" });
  }
};
