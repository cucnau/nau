import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "cucnau-8940d",
  appId: "1:389888645581:web:474e9ecc32bf6423584c84",
  apiKey: "AIzaSyB8ODpKi8rKzPxp0WbbTWBnzS_kwQ5rfiI",
  authDomain: "cucnau-8940d.firebaseapp.com",
  databaseId: "(default)",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "(default)");

async function run() {
  console.log("Fetching story 5D5LiyrtXbfJHqGNCM7K...");
  const storyRef = doc(db, "stories", "5D5LiyrtXbfJHqGNCM7K");
  const storySnap = await getDoc(storyRef);
  if (storySnap.exists()) {
    console.log("Story data:", storySnap.data());
  } else {
    console.log("Story not found! Let's fetch all stories in Firestore to list titles.");
    const storiesCol = collection(db, "stories");
    const storiesSnap = await getDocs(storiesCol);
    storiesSnap.forEach(d => {
      console.log(`Story ID: ${d.id}, Title: "${d.data().title}", Slug: "${d.data().slug}"`);
    });
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
