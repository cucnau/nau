import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = admin.initializeApp({
  projectId: config.projectId,
});

const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function run() {
  console.log(`Using databaseId: ${config.firestoreDatabaseId || '(default)'}`);
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', 'cucnau01@gmail.com').get();
  if (snapshot.empty) {
    console.log('No user found with email cucnau01@gmail.com');
    return;
  }

  snapshot.forEach(doc => {
    console.log(`User ID: ${doc.id}`);
    const data = doc.data();
    console.log('choco:', data.choco);
    console.log('goldenChoco:', data.goldenChoco);
    console.log('totalSpentChoco:', data.totalSpentChoco);
    console.log('totalEarnedChoco:', data.totalEarnedChoco);
    console.log('totalEarnedGChoco:', data.totalEarnedGChoco);
    console.log('claimedPermanentTiers:', data.claimedPermanentTiers);
    console.log('lastClaimedRewardLevel:', data.lastClaimedRewardLevel);
  });
}

run().catch(console.error);
