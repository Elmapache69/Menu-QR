import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function addMenuOrderChanges(batch, changes, reservedWrites = 0) {
  if (changes.length + reservedWrites > 500) {
    throw new Error("Hay demasiados platos para guardar el cambio de una vez.");
  }
  for (const change of changes) {
    batch.update(doc(db, "items", change.id), change.fields);
  }
}

export async function saveMenuOrder(changes) {
  if (!changes.length) return;
  const batch = writeBatch(db);
  addMenuOrderChanges(batch, changes);
  await batch.commit();
}
