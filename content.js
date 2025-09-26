console.log("Scriven extension: Content script loaded.");

let currentVideoId = null;

function getVideoId() {
  return new URLSearchParams(window.location.search).get("v");
}

function handleSaveNote(videoId) {
  const noteInput = document.getElementById("yn-note-input");
  const noteText = noteInput.value;
  const videoElement = document.querySelector("video.html5-main-video");
  if (noteText.trim() !== "" && videoElement) {
    const newNote = {
      timestamp: videoElement.currentTime,
      text: noteText.trim(),
    };
    chrome.runtime.sendMessage(
      { action: "saveNote", videoId: videoId, note: newNote },
      (response) => {
        if (response.success) {
          newNote.id = response.newId;
          addNoteToList(newNote, videoId);
        }
      }
    );
    noteInput.value = "";
  }
}

function main() {
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

main();
