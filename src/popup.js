document.addEventListener("DOMContentLoaded", async () => {
  const toggleSwitch = document.getElementById("toggle-ui");
  const storageKey = "scrivenUiVisible";

  const data = await browser.storage.local.get(storageKey);
  toggleSwitch.checked = data[storageKey] !== false;

  toggleSwitch.addEventListener("change", async () => {
    const isVisible = toggleSwitch.checked;
    await browser.storage.local.set({ [storageKey]: isVisible });

    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
      url: "*://*.youtube.com/watch*",
    });

    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, {
        action: "toggleUI",
        visible: isVisible,
      });
    }
  });

  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-btn");
  const searchResultsContainer = document.getElementById("search-results");

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      browser.runtime
        .sendMessage({ action: "searchAllNotes", query: query })
        .then(displaySearchResults);
    }
  };

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  function displaySearchResults(notes) {
    searchResultsContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
      const noResultsMessage = document.createElement("li");
      noResultsMessage.textContent = "No notes found.";
      noResultsMessage.style.padding = "8px";
      searchResultsContainer.appendChild(noResultsMessage);
      return;
    }

    notes.sort((a, b) => a.timestamp - b.timestamp);

    notes.forEach((note) => {
      const item = document.createElement("li");
      item.className = "search-result-item";
      item.innerHTML = `
        <div class="note-text">${note.text}</div>
        <div class="note-meta">Timestamp: ${formatTimestamp(
          note.timestamp
        )}</div>
      `;

      item.addEventListener("click", () => {
        const url = `https://www.youtube.com/watch?v=${
          note.videoId
        }&t=${Math.floor(note.timestamp)}s`;
        browser.tabs.create({ url: url });
      });

      searchResultsContainer.appendChild(item);
    });
  }

  function displaySearchResults(notes) {
    searchResultsContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
      const noResultsMessage = document.createElement("li");
      noResultsMessage.textContent = "No notes found.";
      noResultsMessage.style.padding = "8px";
      searchResultsContainer.appendChild(noResultsMessage);
      return;
    }

    const notesByVideo = notes.reduce((acc, note) => {
      if (!acc[note.videoId]) {
        acc[note.videoId] = {
          title: note.title,
          notes: [],
        };
      }
      acc[note.videoId].notes.push(note);
      return acc;
    }, {});

    for (const videoId in notesByVideo) {
      const video = notesByVideo[videoId];

      video.notes.sort((a, b) => a.timestamp - b.timestamp);

      video.notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "search-result-item";
        item.innerHTML = `
                <div class="note-title">${note.title || "Untitled Video"}</div>
                <div class="note-text">${note.text}</div>
                <div class="note-meta">Timestamp: ${formatTimestamp(
                  note.timestamp
                )}</div>
            `;

        item.addEventListener("click", () => {
          const url = `https://www.youtube.com/watch?v=${
            note.videoId
          }&t=${Math.floor(note.timestamp)}s`;
          browser.tabs.create({ url: url });
        });

        searchResultsContainer.appendChild(item);
      });
    }
  }
});

function formatTimestamp(totalSeconds) {
  const d = new Date(0);
  d.setSeconds(totalSeconds);
  return d.toISOString().substr(11, 8);
}
