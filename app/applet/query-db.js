import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
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
  const q = query(usersRef, orderBy('chucuGameMaxScore', 'desc'), limit(10));
  const snap = await getDocs(q);
  console.log("TOP CHUCU GAME USERS:");
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Name: ${data.displayName}, Email: ${data.email}, Score: ${data.chucuGameMaxScore}`);
  });
  
  process.exit(0);
}

run();
