import { storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function safeName(name = "photo.jpg") {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function uploadListingPhotos({ uid, listingId, files }) {
  const arr = Array.from(files || []);
  if (!uid || !listingId || arr.length === 0) return [];

  const uploads = arr.map(async (file, idx) => {
    const filename = `${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}_${safeName(file.name)}`;
    const path = `listings/${uid}/${listingId}/${filename}`;
    const r = ref(storage, path);

    await uploadBytes(r, file);
    return await getDownloadURL(r);
  });

  return await Promise.all(uploads);
}
