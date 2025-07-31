// controllers/room.controller.js
const { db } = require("../firebase");
const roomsCollection = db.collection("rooms");
const roomTypesCollection = db.collection("room_types");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: "dlykpbl7s",
  api_key: "521329916477217",
  api_secret: "fb3-o3JWfbQxoayJZjPgyX3RZJc",
});

// Get all rooms with room type info
exports.getAllRooms = async (req, res) => {
  try {
    const snapshot = await roomsCollection.get();
    const rooms = [];

    for (const doc of snapshot.docs) {
      const roomData = doc.data();

      let roomTypeData = null;
      if (roomData.roomTypeId) {
        const roomTypeDoc = await roomTypesCollection
          .doc(roomData.roomTypeId)
          .get();
        if (roomTypeDoc.exists) {
          roomTypeData = roomTypeDoc.data();
        }
      }

      rooms.push({
        id: doc.id,
        ...roomData,
        roomType: roomTypeData,
      });
    }

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error getting rooms", error });
  }
};

// Get single room with room type info
exports.getRoomById = async (req, res) => {
  try {
    const roomDoc = await roomsCollection.doc(req.params.id).get();
    if (!roomDoc.exists)
      return res.status(404).json({ message: "Room not found" });

    const roomData = roomDoc.data();

    let roomTypeData = null;
    if (roomData.roomTypeId) {
      const roomTypeDoc = await roomTypesCollection
        .doc(roomData.roomTypeId)
        .get();
      if (roomTypeDoc.exists) {
        roomTypeData = roomTypeDoc.data();
      }
    }

    res.json({
      id: roomDoc.id,
      ...roomData,
      roomType: roomTypeData,
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting room", error });
  }
};

// Create room with roomTypeId and upload image to Cloudinary
exports.createRoom = async (req, res) => {
  try {
    const { image, roomTypeId, ...roomData } = req.body;

    let imageUrl = "";
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: "assets/images",
      });
      imageUrl = uploadRes.secure_url;
    }

    const docRef = await roomsCollection.add({
      ...roomData,
      roomTypeId,
      image: imageUrl,
    });

    res.status(201).json({ message: "Room created", id: docRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error });
  }
};

// Update room (allow updating any field including roomTypeId)
exports.updateRoom = async (req, res) => {
  try {
    await roomsCollection.doc(req.params.id).update(req.body);
    res.json({ message: "Room updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    await roomsCollection.doc(req.params.id).delete();
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting room", error });
  }
};
