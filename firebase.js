const admin = require("firebase-admin");
// const serviceAccount = require("./hotelbooking.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIAL);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
