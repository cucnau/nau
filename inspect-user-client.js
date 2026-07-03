import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const uid = 'rJIr1TEy9BgW3W2a0dN9j8bj78x1';
  console.log(`Fetching transactions for uid: ${uid}`);
  const txRef = collection(db, `users/${uid}/transactions`);
  // Get all transactions to look for revocations
  const snapshot = await getDocs(txRef);
  if (snapshot.empty) {
    console.log('No transactions found');
    process.exit(0);
  }

  const txs = [];
  snapshot.forEach(doc => {
    txs.push({ id: doc.id, ...doc.data() });
  });

  // Sort by createdAt desc if it is a Firestore timestamp or just js date
  txs.sort((a, b) => {
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  console.log(`Total transactions: ${txs.length}`);
  console.log('Latest 15 transactions:');
  txs.slice(0, 15).forEach((t, idx) => {
    console.log(`${idx+1}. [${t.currency}] ${t.type} ${t.amount} choco. Reason: "${t.reason}". BalanceAfter: ${t.balanceAfter}`);
  });

  console.log('\nSearching for deductions/revocations:');
  txs.forEach((t) => {
    if (t.type === 'spend' || t.reason?.toLowerCase().includes('thu hồi') || t.reason?.toLowerCase().includes('trùng') || t.reason?.toLowerCase().includes('revok') || t.reason?.toLowerCase().includes('deduct') || t.reason?.toLowerCase().includes('trừ')) {
      console.log(`- [${t.currency}] ${t.type} ${t.amount} choco. Reason: "${t.reason}". BalanceAfter: ${t.balanceAfter}`);
    }
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
