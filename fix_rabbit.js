import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

// Only initialize if not already initialized
let app;
try {
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} catch(e) {
  // Already initialized
}

const db = getFirestore();

async function fix() {
  const usersSnap = await db.collection('users').where('email', '==', 'cucnau01@gmail.com').get();
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  const userRef = usersSnap.docs[0].ref;
  const userData = usersSnap.docs[0].data();
  console.log('User:', userData.email);

  const framesSnap = await db.collection('store_frames').get();
  framesSnap.forEach(doc => {
    const f = doc.data();
    if (f.name.toLowerCase().includes('rabbit') || f.name.toLowerCase().includes('thỏ')) {
      console.log('Found frame:', f.name, f.url);
      const owned = userData.ownedFrames || [];
      if (!owned.includes(f.url)) {
        owned.push(f.url);
        userRef.update({ ownedFrames: owned });
        console.log('Added to user ownedFrames');
      } else {
        console.log('User already owns this frame');
      }
    }
  });
}

fix().catch(console.error);
