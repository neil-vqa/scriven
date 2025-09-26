console.log("Scriven extension: UI script loaded.");

const styles = `#youtube-notes-container {
	position: fixed;
	bottom: 20px;
	right: 20px;
	width: 360px;
	z-index: 10000;
	border: 1px solid #ccc;
	border-radius: 8px;
	background-color: #ffffff;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	font-family: Arial, sans-serif;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

#yn-header {
	padding: 10px 16px;
	background-color: #f1f1f1;
	cursor: pointer;
	border-bottom: 1px solid #ddd;
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-weight: bold;
	color: #333;
	transition: background-color 0.1s ease, color 0.1s ease;
}

#yn-header:hover {
	background-color: #d3d3d3;
}

#yn-body {
	padding: 16px;
    padding-top: 0;
	max-height: 450px;
	overflow-y: auto;
	transition: all 0.3s ease;
	background-color: #f9f9f9;
}

#youtube-notes-container.collapsed #yn-body {
	display: none;
}

#youtube-notes-container.collapsed #yn-header {
	border-bottom: none;
}

h3 {
	margin: 1rem 0;
	color: #333;
	font-size: 12px;
}

#yn-note-input {
	width: 95%;
	height: 60px;
	margin-bottom: 10px;
	border-radius: 4px;
	border: 1px solid #ccc;
	padding: 8px;
	font-size: 14px;
}

#yn-save-note-btn {
	padding: 8px 12px;
	border: none;
	border-radius: 4px;
	background-color: #007bff;
	color: white;
	cursor: pointer;
}

#yn-save-note-btn:hover {
	background-color: #0056b3;
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
	border-bottom: 1px solid #dbdbdb;
}

#yn-notes-list li:hover {
	background-color: #e2e2e2;
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

.yn-edit-btn,
.yn-delete-btn,
.yn-save-edit-btn {
	background: #888;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	padding: 4px 8px;
	font-size: 12px;
	opacity: 0.8;
}

.yn-delete-btn {
	background: #ff4d4d;
}

.yn-save-edit-btn {
	background: #28a745;
}

.yn-edit-btn:hover,
.yn-delete-btn:hover,
.yn-save-edit-btn:hover {
	opacity: 1;
}

.yn-edit-textarea {
	width: 98%;
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
        <h3>Add a Note at Current Timestamp</h3>
        <textarea id="yn-note-input" placeholder="Type your note here..."></textarea>
        <button id="yn-save-note-btn">Save Note</button>
        <h3>Notes for this Video</h3>
        <ul id="yn-notes-list"></ul>
    </div>
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
  editButton.textContent = "Edit";

  const deleteButton = document.createElement("button");
  deleteButton.className = "yn-delete-btn";
  deleteButton.textContent = "Delete";

  actionsDiv.appendChild(editButton);
  actionsDiv.appendChild(deleteButton);

  deleteButton.onclick = () => {
    listItem.remove();
    chrome.runtime.sendMessage({
      action: "deleteNote",
      videoId: currentVideoId,
      note: { id: note.id },
    });
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

        chrome.runtime.sendMessage({ action: "updateNote", note: note });

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
  chrome.runtime.sendMessage(
    { action: "getNotes", videoId: currentVideoId },
    (notes) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      const notesList = document.getElementById("yn-notes-list");
      if (notesList) {
        notesList.innerHTML = "";
        notes.sort((a, b) => a.timestamp - b.timestamp);
        notes.forEach((note) => addNoteToList(note, currentVideoId));
      }
    }
  );
}
