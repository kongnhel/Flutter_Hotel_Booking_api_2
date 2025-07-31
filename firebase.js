// src/firebase.js
const admin = require("firebase-admin");

// អានពីអថេរបរិស្ថាន
const serviceAccountKeyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// ពិនិត្យមើលថាតើអថេរបរិស្ថានត្រូវបានកំណត់ដែរឬទេ
if (!serviceAccountKeyString) {
  console.error(
    "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set."
  );
  // អ្នកអាចជ្រើសរើសបោះកំហុស ឬចេញពីកម្មវិធី
  process.exit(1);
}

try {
  // Parse (បំបែក) JSON string ទៅជា JavaScript object
  const serviceAccount = JSON.parse(serviceAccountKeyString);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error(
    "Error parsing Firebase service account key from environment variable:",
    error
  );
  // បោះពុម្ព string ដែលមានបញ្ហាសម្រាប់ការបំបាត់កំហុស
  console.error(
    "Problematic string snippet (first 100 chars):",
    serviceAccountKeyString.substring(0, 100)
  );
  process.exit(1);
}

const db = admin.firestore();

module.exports = { admin, db };
