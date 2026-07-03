import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', 'cucnau01@gmail.com'));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log('No user found');
    process.exit(0);
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Email:", data.email);
    console.log("Choco:", data.choco);
    console.log("Golden Choco:", data.goldenChoco);
    console.log("Total Earned Choco:", data.totalEarnedChoco);
    console.log("Total Spent Choco:", data.totalSpentChoco);
    console.log("Claimed Permanent Tiers:", data.claimedPermanentTiers);
    console.log("Unlocked Achievements Count:", data.unlockedAchievements?.length || 0);
    console.log("Unlocked Achievements:", data.unlockedAchievements);
    console.log("Claimed Achievements:", data.claimedAchievements);
    
    const dbMissions = data.missions || [];
    console.log(`Total missions in DB: ${dbMissions.length}`);
    dbMissions.forEach(m => {
      console.log(`- ID: ${m.id}, completed: ${m.completed}, claimed: ${m.claimed}, progress: ${m.progress}`);
    });
  });
  
  process.exit(0);
}

run().catch(console.error);
