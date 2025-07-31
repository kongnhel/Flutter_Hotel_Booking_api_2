const admin = require("firebase-admin");
const serviceAccount = require("./hotelbooking.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
