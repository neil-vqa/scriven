console.log("Scriven extension: UI script loaded.");

const styles = `#youtube-notes-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  z-index: 10000;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  font-family: Arial, sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#youtube-notes-container.collapsed #yn-body {
  display: none;
}

#youtube-notes-container.collapsed #yn-header {
  border-bottom: none;
}

#yn-header {
  padding: 10px 16px;
  background-color: rgba(228, 219, 213, 0.65);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000;
  transition: background-color 0.1s ease, color 0.1s ease;
  opacity: 0.8;
}

#yn-header:hover {
  background-color: rgba(228, 219, 213, 1);
}

#yn-body {
  padding: 16px;
  max-height: 450px;
  overflow-y: auto;
  transition: all 0.3s ease;
  background-color: #fff;
}

.reg-text {
  color: #777;
  margin: 0;
  font-size: 0.85rem;
}

#yn-note-input {
  width: 95%;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 14px;
}

#yn-save-note-btn {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #a7bba0;
  cursor: pointer;
  color: #777;
  background-color: transparent;
  display: flex;
  align-items: center;
  column-gap: 4px;
  box-shadow: 0 4px 8px rgba(131, 131, 131, 0.2);
  font-size: 12px;
}

#yn-save-note-btn:hover {
  background-color: rgba(167, 187, 160, 0.4);
}

hr {
  margin: 18px 0;
  opacity: 0.4;
}

#yn-notes-list {
  list-style-type: none;
  padding: 0;
  margin-top: 15px;
  max-height: 250px;
  overflow-y: auto;
}

#yn-notes-list li {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 2px dotted #dbdbdb;
}

#yn-notes-list li:hover {
  background-color: #f3f3e9;
}

.yn-note-content {
  display: flex;
  flex-direction: column;
}

.yn-note-actions {
  display: flex;
  gap: 5px;
  margin-left: 10px;
}

.yn-timestamp {
  font-weight: bold;
  color: #0056b3;
  cursor: pointer;
  display: block;
  margin-bottom: 4px;
  max-width: 60px;
}

.yn-timestamp:hover {
  text-decoration: underline;
}

.yn-text {
  font-size: 1.1rem;
  white-space: pre-wrap;
}

.yn-note-actions > button {
  background: transparent;
  color: #777;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  border: 1px solid #a7bba0;
  display: flex;
  align-items: center;
}

.yn-note-actions > button:hover {
  background-color: rgba(167, 187, 160, 0.4);
}

.yn-edit-textarea {
  width: 98%;
  height: 60px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px;
}`;

const uiHTML = `
<style>${styles}</style>
<div id="yn-header">
  <span>Take notes on this video</span>
  <span>Scriven</span>
</div>
<div id="yn-body">
  <textarea
    id="yn-note-input"
    placeholder="Type your note here..."
  ></textarea>
  <button id="yn-save-note-btn">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#777"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 5l0 14" />
      <path d="M5 12l14 0" />
    </svg>
    <span>Add This Note at Current Timestamp</span>
  </button>
  <ul id="yn-notes-list">
  </ul>
</div>
`;

const editSvg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#777"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
  <path d="M13.5 6.5l4 4" />
</svg>
`;

const deleteSvg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="#777"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 7h16" />
  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  <path d="M10 12l4 4m0 -4l-4 4" />
</svg>
`;

function formatTimestamp(totalSeconds) {
  const d = new Date(0);
  d.setSeconds(totalSeconds);
  return d.toISOString().substr(11, 8);
}

function addNoteToList(note, currentVideoId) {
  const notesList = document.getElementById("yn-notes-list");
  if (!notesList) return;

  const listItem = document.createElement("li");
  const contentDiv = document.createElement("div");
  contentDiv.className = "yn-note-content";
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "yn-note-actions";

  const timestampSpan = document.createElement("span");
  timestampSpan.className = "yn-timestamp";
  timestampSpan.textContent = `[${formatTimestamp(note.timestamp)}]`;
  timestampSpan.onclick = () => {
    document.querySelector("video.html5-main-video").currentTime =
      note.timestamp;
  };

  const textSpan = document.createElement("span");
  textSpan.className = "yn-text";
  textSpan.textContent = note.text;

  contentDiv.appendChild(timestampSpan);
  contentDiv.appendChild(textSpan);

  const editButton = document.createElement("button");
  editButton.className = "yn-edit-btn";
  editButton.innerHTML = editSvg;
  editButton.title = "Edit";

  const deleteButton = document.createElement("button");
  deleteButton.className = "yn-delete-btn";
  deleteButton.innerHTML = deleteSvg;
  deleteButton.title = "Delete";

  actionsDiv.appendChild(editButton);
  actionsDiv.appendChild(deleteButton);

  deleteButton.onclick = () => {
    listItem.remove();
    browser.runtime
      .sendMessage({
        action: "deleteNote",
        videoId: currentVideoId,
        note: { id: note.id },
      })
      .catch((e) => console.error("Error deleting note:", e));
  };

  editButton.onclick = () => {
    const currentText = textSpan.textContent;
    const editArea = document.createElement("textarea");
    editArea.className = "yn-edit-textarea";
    editArea.value = currentText;

    const saveEditButton = document.createElement("button");
    saveEditButton.className = "yn-save-edit-btn";
    saveEditButton.textContent = "Save";

    contentDiv.replaceChild(editArea, textSpan);
    actionsDiv.replaceChild(saveEditButton, editButton);

    saveEditButton.onclick = () => {
      const newText = editArea.value.trim();
      if (newText) {
        note.text = newText;
        textSpan.textContent = newText;

        browser.runtime
          .sendMessage({ action: "updateNote", note: note })
          .catch((e) => console.error("Error updating note:", e));

        contentDiv.replaceChild(textSpan, editArea);
        actionsDiv.replaceChild(editButton, saveEditButton);
      }
    };
  };

  listItem.appendChild(contentDiv);
  listItem.appendChild(actionsDiv);
  notesList.appendChild(listItem);
}

function injectUI(currentVideoId, onSave) {
  const targetElement = document.body;
  if (targetElement && !document.getElementById("youtube-notes-container")) {
    const container = document.createElement("div");
    container.id = "youtube-notes-container";
    container.innerHTML = uiHTML;

    container.classList.add("collapsed");
    targetElement.appendChild(container);

    const header = document.getElementById("yn-header");
    header.title = "Click to add/show notes";

    header.addEventListener("click", () => {
      container.classList.toggle("collapsed");
      if (container.classList.contains("collapsed")) {
        header.title = "Click to add/show notes";
      } else {
        header.title = "Click to hide/close";
      }
    });

    document
      .getElementById("yn-save-note-btn")
      .addEventListener("click", () => onSave(currentVideoId));

    loadNotes(currentVideoId);
    return true;
  }
  return false;
}

function loadNotes(currentVideoId) {
  browser.runtime
    .sendMessage({ action: "getNotes", videoId: currentVideoId })
    .then((notes) => {
      const notesList = document.getElementById("yn-notes-list");
      if (notesList && notes) {
        notesList.innerHTML = "";
        notes.sort((a, b) => a.timestamp - b.timestamp);
        notes.forEach((note) => addNoteToList(note, currentVideoId));
      }
    })
    .catch((error) => {
      console.error("Error loading notes:", error.message);
    });
}

// TODO: add UI for popup
// list all vids with notes, search through notes
