console.log("Scriven extension: Background script loaded.");

const DB_NAME = "YouTubeNotesDB";
const STORE_NAME = "notes";
let db;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject("Database error");
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("videoId_idx", "videoId", { unique: false });
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Database opened successfully.");
      resolve(db);
    };
  });
}
async function addNote(note) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(note);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
async function getNotes(videoId) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("videoId_idx");
    const request = index.getAll(videoId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
async function deleteNote(noteId) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(noteId);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

async function updateNote(note) {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(note);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

initDB();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { videoId, note } = message;

  if (message.action === "saveNote") {
    const noteToStore = { ...note, videoId: videoId };
    addNote(noteToStore).then((newId) =>
      sendResponse({ success: true, newId: newId })
    );
    return true;
  } else if (message.action === "getNotes") {
    getNotes(videoId).then((notes) => sendResponse(notes));
    return true;
  } else if (message.action === "deleteNote") {
    deleteNote(note.id).then(() => sendResponse({ success: true }));
    return true;
  } else if (message.action === "updateNote") {
    console.log("Updating note:", note);
    updateNote(note).then(() => sendResponse({ success: true }));
    return true;
  }
});
