const admin = require("firebase-admin");
const { db } = require("../firebase");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dlykpbl7s",
  api_key: "521329916477217",
  api_secret: "fb3-o3JWfbQxoayJZjPgyX3RZJc",
});

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("user").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
// Update user role

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await db.collection("user").doc(id).update({ role });
    res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("user").doc(id).delete();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ✅ Get user by ID
exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const doc = await db.collection("user").doc(userId).get();

    if (!doc.exists) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send({ id: userId, ...doc.data() });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

// Create user profile after verifying Firebase ID token
exports.createUser = async (req, res) => {
  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken)
    return res.status(401).send({ error: "Unauthorized: Missing token" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user profile already exists
    const userDoc = await db.collection("user").doc(uid).get();
    if (userDoc.exists) {
      return res.status(409).send({ error: "User profile already exists" });
    }

    // Save user profile to Firestore
    const { email, role, canEdit, canDelete, firstName, lastName } = req.body;

    await db
      .collection("user")
      .doc(uid)
      .set({
        email,
        role,
        canEdit,
        canDelete,
        firstName: firstName || "",
        lastName: lastName || "",
      });

    res.status(201).send({ message: "User profile created", id: uid });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(401).send({ error: "Invalid token or unauthorized" });
  }
};

// Login user by verifying Firebase ID token and returning profile
exports.loginUser = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).send({ error: "Missing ID token" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const doc = await db.collection("user").doc(uid).get();
    if (!doc.exists)
      return res.status(404).send({ error: "User profile not found" });

    const user = doc.data();

    res.status(200).send({
      message: "Login successful",
      id: uid,
      email: user.email,
      role: user.role,
      canEdit: user.canEdit,
      canDelete: user.canDelete,
      phone: user.phone,
      profileImage: user.profileImage,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).send({ error: "Invalid or expired token" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken) return res.status(401).send({ error: "Unauthorized" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let { phone, profileImage } = req.body; // profileImage: base64 string or data URL

    const updateData = {};

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (profileImage) {
      // If profileImage is a base64 string or data URL, upload to Cloudinary
      // If it's already a URL (e.g., startsWith http), you can skip upload
      if (profileImage.startsWith("http")) {
        updateData.profileImage = profileImage;
      } else {
        // Upload image to Cloudinary folder "profile_images"
        const uploadRes = await cloudinary.uploader.upload(profileImage, {
          folder: "assets/images",
        });
        updateData.profileImage = uploadRes.secure_url;
      }
    }

    await db.collection("user").doc(uid).update(updateData);

    res
      .status(200)
      .send({ message: "Profile updated", updatedFields: updateData });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send({ error: "Failed to update profile" });
  }
};

// Logout is handled client-side by deleting the token/session
// You can optionally blacklist tokens or handle logout sessions here if needed
exports.logoutUser = async (req, res) => {
  // Since Firebase tokens are stateless JWTs,
  // logout is done on the client by deleting token/session.
  // You can implement token revocation here if needed:

  try {
    // Example: revoke refresh tokens for user (optional)
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) return res.status(400).send({ error: "Missing token" });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    await admin.auth().revokeRefreshTokens(uid);

    res.status(200).send({ message: "User logged out (tokens revoked)" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).send({ error: "Could not log out user" });
  }
};
