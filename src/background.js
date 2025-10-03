try {
  if (typeof importScripts === "function") {
    importScripts("../lib/browser-polyfill.min.js");
  }
} catch (e) {
  console.error(e);
}

console.log("Scriven extension: Background script loaded.");

const DB_NAME = "ScrivenDB";
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

async function getAllNotes() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function exportNotesToJson(notes) {
  if (!notes || notes.length === 0) {
    console.log("No notes to export.");
    return;
  }

  const jsonString = JSON.stringify(notes, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `scriven_export_${timestamp}.json`;

  browser.downloads
    .download({
      url: url,
      filename: filename,
      saveAs: true,
    })
    .then((downloadId) => {
      // After the download starts, Chrome/Firefox invalidates the blob URL.
      // We don't strictly need to revoke it here, but it's good practice.
      // We check if the download started before revoking.
      if (downloadId) {
        console.log("Export started with download ID:", downloadId);
      }
    })
    .catch((err) => {
      console.error("Export failed:", err);
    });
}

initDB();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
  } else if (message.action === "searchAllNotes") {
    getAllNotes().then((allNotes) => {
      const query = message.query.toLowerCase();
      const results = allNotes.filter((n) =>
        n.text.toLowerCase().includes(query)
      );
      sendResponse(results);
    });
    return true;
  } else if (message.action === "getAllVideosWithNotes") {
    getAllNotes().then((allNotes) => {
      const videos = new Map();
      allNotes.forEach((note) => {
        if (!videos.has(note.videoId)) {
          videos.set(note.videoId, {
            videoId: note.videoId,
            title: note.title || "Untitled Video",
            noteCount: 0,
          });
        }
        videos.get(note.videoId).noteCount++;
      });
      sendResponse(Array.from(videos.values()));
    });
    return true;
  } else if (message.action === "exportAllNotes") {
    getAllNotes().then((notes) => {
      exportNotesToJson(notes);
    });
  }
});
