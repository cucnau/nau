import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const uid = 'rJIr1TEy9BgW3W2a0dN9j8bj78x1';
  const txRef = collection(db, `users/${uid}/transactions`);
  const snapshot = await getDocs(txRef);
  if (snapshot.empty) {
    console.log('No transactions found');
    process.exit(0);
  }

  const txs = [];
  snapshot.forEach(doc => {
    txs.push({ id: doc.id, ...doc.data() });
  });

  console.log('Transactions with amount >= 10000:');
  txs.forEach((t) => {
    if (t.amount >= 10000) {
      console.log(`- [${t.currency}] ${t.type} ${t.amount} choco. Reason: "${t.reason}". BalanceAfter: ${t.balanceAfter}`);
    }
  });

  process.exit(0);
}

run().catch(console.error);
