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
    const dbMissions = data.missions || [];
    
    const pSpends = dbMissions.filter(m => m.id.startsWith('p_spend_'));
    console.log(`Total p_spend missions in DB: ${pSpends.length}`);
    
    // Sort them by tier number
    pSpends.sort((a, b) => {
      const numA = parseInt(a.id.split('_')[2], 10);
      const numB = parseInt(b.id.split('_')[2], 10);
      return numA - numB;
    });

    pSpends.forEach(m => {
      console.log(`- ID: ${m.id}, completed: ${m.completed}, claimed: ${m.claimed}, progress: ${m.progress}`);
    });
  });
  
  process.exit(0);
}

run().catch(console.error);
