import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
  console.log("No firebase config");
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  
  console.log("ALL REGISTERED USERS IN DATABASE:");
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Email: ${data.email} | Name: ${data.displayName} | Score: ${data.chucuGameMaxScore} | Choco: ${data.choco}`);
    if (data.email?.toLowerCase() === 'cucnau01@gmail.com') {
      console.log("--- ADMIN DETAIL ---");
      console.log(`UID: ${doc.id}`);
      console.log(`totalChaptersRead: ${data.totalChaptersRead}`);
      console.log(`storyProgress:`, JSON.stringify(data.storyProgress));
      console.log(`missions count: ${data.missions?.length || 0}`);
    }
  });
  
  process.exit(0);
}

run();
