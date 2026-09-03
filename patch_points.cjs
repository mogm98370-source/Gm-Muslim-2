const fs = require('fs');

let store = fs.readFileSync('src/components/store/Store.tsx', 'utf8');
store = store.replace(
  "import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';",
  "import { collection, getDocs, doc, writeBatch, increment } from 'firebase/firestore';"
);
store = store.replace(
  "updateData.gmPoints = currentPoints - product.price;",
  "updateData.gmPoints = increment(-product.price);"
);
fs.writeFileSync('src/components/store/Store.tsx', store);

let mail = fs.readFileSync('src/components/mail/Mail.tsx', 'utf8');
mail = mail.replace(
  "import { collection, query, where, getDocs, doc, writeBatch, orderBy } from 'firebase/firestore';",
  "import { collection, query, where, getDocs, doc, writeBatch, orderBy, increment } from 'firebase/firestore';"
);
mail = mail.replace(
  "batch.update(userRef, { gmPoints: (userData.gmPoints || 0) + msg.attachedGems, totalEarnedPoints: (userData.totalEarnedPoints || 0) + msg.attachedGems });",
  "batch.update(userRef, { gmPoints: increment(msg.attachedGems), totalEarnedPoints: increment(msg.attachedGems) });"
);
fs.writeFileSync('src/components/mail/Mail.tsx', mail);

