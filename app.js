// Firebase initialization and database references
// Replace the config object with your own Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyDk4JrO7MItIn6_PBDtr0fBqQYXBeqNuiM",
  authDomain: "dropbox-47184.firebaseapp.com",
  databaseURL: "https://dropbox-47184-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "dropbox-47184",
  storageBucket: "dropbox-47184.firebasestorage.app",
  messagingSenderId: "43247427374",
  appId: "1:43247427374:web:aa8fcbe26a6834d8f164bf",
  measurementId: "G-38JBSYDSCG"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

const fileGallery = document.getElementById('fileGallery');
const todoGallery = document.getElementById('todoGallery');
const searchInput = document.getElementById('searchInput');
const filterTag = document.getElementById('filterTag');
const filterDate = document.getElementById('filterDate');
const openUploadModal = document.getElementById('openUploadModal');
const openTodoModal = document.getElementById('openTodoModal');
const modalOverlay = document.getElementById('modalOverlay');
const previewOverlay = document.getElementById('previewOverlay');
const closeModal = document.getElementById('closeModal');
const closePreview = document.getElementById('closePreview');
const modalContent = document.getElementById('modalContent');
const previewContent = document.getElementById('previewContent');

let allFiles = [];
let allTodos = [];

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function openOverlay(overlay) {
  overlay.classList.remove('hidden');
}

function closeAllOverlays() {
  modalOverlay.classList.add('hidden');
  previewOverlay.classList.add('hidden');
  modalContent.innerHTML = '';
  previewContent.innerHTML = '';
}

closeModal.addEventListener('click', closeAllOverlays);
closePreview.addEventListener('click', closeAllOverlays);
window.addEventListener('click', (event) => {
  if (event.target === modalOverlay || event.target === previewOverlay) {
    closeAllOverlays();
  }
});

openUploadModal.addEventListener('click', () => {
  modalContent.innerHTML = createFileForm();
  openOverlay(modalOverlay);
  document.getElementById('fileForm').addEventListener('submit', handleUploadSubmit);
});

openTodoModal.addEventListener('click', () => {
  modalContent.innerHTML = createTodoForm();
  openOverlay(modalOverlay);
  document.getElementById('todoForm').addEventListener('submit', handleTodoSubmit);
});

function createFileForm() {
  return `
    <h3>Add File / Gallery Item</h3>
    <form id="fileForm" class="modal-grid">
      <label>
        Title
        <input type="text" id="fileTitle" required placeholder="Enter file title" />
      </label>
      <label>
        Tag
        <input type="text" id="fileTag" required placeholder="e.g. report, invoice, photo" />
      </label>
      <label>
        Description (optional)
        <textarea id="fileDescription" rows="3" placeholder="Short description"></textarea>
      </label>
      <label>
        Choose file
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx,.jpg,.jpeg" required />
      </label>
      <button type="submit" class="primary-btn">Upload file</button>
    </form>
  `;
}

function createTodoForm() {
  return `
    <h3>Add Todo Board</h3>
    <form id="todoForm" class="modal-grid">
      <label>
        Name
        <input type="text" id="todoName" required placeholder="Board name" />
      </label>
      <label>
        Tag
        <input type="text" id="todoTag" required placeholder="e.g. project, shopping" />
      </label>
      <label>
        Description
        <textarea id="todoDescription" rows="3" placeholder="Short description"></textarea>
      </label>
      <label>
        First todo item
        <input type="text" id="todoItemText" placeholder="Write one todo item" />
      </label>
      <button type="submit" class="primary-btn">Create board</button>
    </form>
  `;
}

async function handleUploadSubmit(event) {
  event.preventDefault();
  const title = document.getElementById('fileTitle').value.trim();
  const tag = document.getElementById('fileTag').value.trim();
  const description = document.getElementById('fileDescription').value.trim();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return;

  const createdAt = Date.now();
  const storageRef = storage.ref().child(`uploads/${createdAt}_${file.name}`);
  const uploadTask = storageRef.put(file);

  uploadTask.on('state_changed', null, (error) => {
    console.error('Upload failed', error);
  }, async () => {
    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
    const newFileRef = database.ref('files').push();
    newFileRef.set({
      title,
      tag,
      description,
      createdAt,
      fileName: file.name,
      mimeType: file.type,
      downloadURL
    });
    closeAllOverlays();
  });
}

async function handleTodoSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('todoName').value.trim();
  const tag = document.getElementById('todoTag').value.trim();
  const description = document.getElementById('todoDescription').value.trim();
  const itemText = document.getElementById('todoItemText').value.trim();

  const todoRef = database.ref('todos').push();
  const todoPayload = {
    name,
    tag,
    description,
    createdAt: Date.now(),
    items: []
  };

  if (itemText) {
    todoPayload.items.push({ text: itemText, done: false, id: Date.now() });
  }

  todoRef.set(todoPayload);
  closeAllOverlays();
}

function renderFiles(files) {
  fileGallery.innerHTML = '';
  files.forEach((file) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-meta tag">${file.tag}</div>
      <h3 class="card-title">${file.title}</h3>
      <div class="file-icon">${createFilePreview(file)}</div>
      <div class="card-meta">${formatDate(file.createdAt)}</div>
      <div class="card-actions">
        <button class="secondary-btn" data-id="${file.id}">Preview</button>
        <button class="primary-btn" data-download="${file.downloadURL}">Download</button>
      </div>
    `;
    const previewBtn = card.querySelector('[data-id]');
    const downloadBtn = card.querySelector('[data-download]');
    previewBtn.addEventListener('click', () => openPreview(file));
    downloadBtn.addEventListener('click', () => {
      window.open(file.downloadURL, '_blank');
    });
    fileGallery.appendChild(card);
  });
}

function createFilePreview(file) {
  if (file.mimeType.startsWith('image/')) {
    return `<img src="${file.downloadURL}" alt="${file.title}" />`;
  }
  if (file.mimeType.includes('pdf')) {
    return '<div>PDF Document</div>';
  }
  return '<div>Document</div>';
}

function openPreview(file) {
  previewContent.innerHTML = `
    <h3>${file.title}</h3>
    <div class="tag">${file.tag}</div>
    <p class="card-meta">${formatDate(file.createdAt)}</p>
    <p>${file.description || 'No description added.'}</p>
    <div class="file-icon">${createFilePreview(file)}</div>
    <button class="primary-btn" id="downloadPreview">Download</button>
  `;
  openOverlay(previewOverlay);
  document.getElementById('downloadPreview').addEventListener('click', () => {
    window.open(file.downloadURL, '_blank');
  });
}

function renderTodos(todos) {
  todoGallery.innerHTML = '';
  todos.forEach((todo) => {
    const card = document.createElement('div');
    card.className = 'card';
    const itemsHtml = todo.items.map(item => `
      <li>
        <label>
          <input type="checkbox" data-board="${todo.id}" data-item="${item.id}" ${item.done ? 'checked' : ''} />
          <span class="todo-text">${item.text}</span>
        </label>
      </li>
    `).join('');

    card.innerHTML = `
      <div class="card-meta tag">${todo.tag}</div>
      <h3 class="card-title">${todo.name}</h3>
      <p class="card-meta">${formatDate(todo.createdAt)}</p>
      <p>${todo.description || 'No description added.'}</p>
      <ul class="todo-list">${itemsHtml}</ul>
      <button class="secondary-btn" data-board-preview="${todo.id}">Open board</button>
    `;

    card.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', handleTodoCheckbox);
    });

    card.querySelector('[data-board-preview]').addEventListener('click', () => openTodoPreview(todo));
    todoGallery.appendChild(card);
  });
}

function handleTodoCheckbox(event) {
  const checkbox = event.target;
  const boardId = checkbox.dataset.board;
  const itemId = checkbox.dataset.item;
  const done = checkbox.checked;
  const itemPath = `todos/${boardId}/items`;

  database.ref(itemPath).once('value').then((snapshot) => {
    const items = snapshot.val() || [];
    const updatedItems = items.map((item) => {
      if (String(item.id) === String(itemId)) {
        return { ...item, done };
      }
      return item;
    });

    database.ref(itemPath).set(updatedItems);
  });
}

function openTodoPreview(todo) {
  const itemsHtml = todo.items.map(item => `
    <li>
      <label>
        <input type="checkbox" disabled ${item.done ? 'checked' : ''} />
        <span class="todo-text">${item.text}</span>
      </label>
    </li>
  `).join('');

  previewContent.innerHTML = `
    <h3>${todo.name}</h3>
    <div class="tag">${todo.tag}</div>
    <p class="card-meta">${formatDate(todo.createdAt)}</p>
    <p>${todo.description || 'No description added.'}</p>
    <ul class="todo-list">${itemsHtml}</ul>
  `;
  openOverlay(previewOverlay);
}

function populateTagFilter(files) {
  const tags = new Set(files.map((file) => file.tag));
  filterTag.innerHTML = '<option value="">All tags</option>' + [...tags].map((tag) => `<option value="${tag}">${tag}</option>`).join('');
}

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const tag = filterTag.value;
  const dateOrder = filterDate.value;

  let filtered = [...allFiles];
  if (query) {
    filtered = filtered.filter((file) => {
      return file.title.toLowerCase().includes(query)
        || (file.description || '').toLowerCase().includes(query)
        || file.tag.toLowerCase().includes(query);
    });
  }
  if (tag) {
    filtered = filtered.filter((file) => file.tag === tag);
  }
  if (dateOrder === 'latest') {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }
  if (dateOrder === 'oldest') {
    filtered.sort((a, b) => a.createdAt - b.createdAt);
  }

  renderFiles(filtered);
}

searchInput.addEventListener('input', applyFilters);
filterTag.addEventListener('change', applyFilters);
filterDate.addEventListener('change', applyFilters);

function subscribeFiles() {
  database.ref('files').on('value', (snapshot) => {
    const rawData = snapshot.val() || {};
    allFiles = Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] }));
    allFiles.sort((a, b) => b.createdAt - a.createdAt);
    populateTagFilter(allFiles);
    applyFilters();
  });
}

function subscribeTodos() {
  database.ref('todos').on('value', (snapshot) => {
    const rawData = snapshot.val() || {};
    allTodos = Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] }));
    allTodos.sort((a, b) => b.createdAt - a.createdAt);
    renderTodos(allTodos);
  });
}

// Start the live subscriptions for both features
subscribeFiles();
subscribeTodos();

// Note: Update Firebase security rules to allow public read/write if you want open access.
// Example Realtime Database rules:
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
