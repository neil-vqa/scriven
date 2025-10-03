console.log("Scriven extension: Content script loaded.");

let currentVideoId = null;
const storageKey = "scrivenUiVisible";

function getVideoId() {
  return new URLSearchParams(window.location.search).get("v");
}

function handleSaveNote(videoId) {
  const noteInput = document.getElementById("yn-note-input");
  const noteText = noteInput.value;
  const videoElement = document.querySelector("video.html5-main-video");

  const titleElement = document.querySelector("#title h1 yt-formatted-string");
  const videoTitle = titleElement ? titleElement.textContent : "Untitled Video";

  if (noteText.trim() !== "" && videoElement) {
    const newNote = {
      timestamp: videoElement.currentTime,
      text: noteText.trim(),
      title: videoTitle,
    };

    browser.runtime
      .sendMessage({ action: "saveNote", videoId: videoId, note: newNote })
      .then((response) => {
        if (response && response.success) {
          newNote.id = response.newId;
          newNote.videoId = videoId;
          addNoteToList(newNote, videoId);
        }
      })
      .catch((error) => {
        console.error("Error saving note:", error);
      });
    noteInput.value = "";
  }
}

async function main() {
  const data = await browser.storage.local.get(storageKey);
  const isVisible = data[storageKey] !== false;

  if (isVisible) {
    runInjectionLogic();
  }
}

function runInjectionLogic() {
  setInterval(() => {
    const newVideoId = getVideoId();
    if (newVideoId) {
      if (newVideoId !== currentVideoId) {
        currentVideoId = newVideoId;
        const oldContainer = document.getElementById("youtube-notes-container");
        if (oldContainer) oldContainer.remove();
        injectUI(currentVideoId, handleSaveNote);
      } else if (!document.getElementById("youtube-notes-container")) {
        injectUI(currentVideoId, handleSaveNote);
      }
    }
  }, 1000);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleUI") {
    const uiContainer = document.getElementById("youtube-notes-container");
    if (message.visible) {
      if (!uiContainer) {
        runInjectionLogic();
      } else {
        uiContainer.style.display = "flex";
      }
    } else {
      if (uiContainer) {
        uiContainer.style.display = "none";
      }
    }
  }
});

main();
