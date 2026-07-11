// =============================================
// CONTENT MANAGER v2
// =============================================

function contentBack() {
  if (state.editingCategory) {
    state.editingCategory = null;
    state.newCategoryData = null;
    renderContentManager();
  } else {
    showScreen('home');
  }
}

function renderContentManager() {
  if (state.editingCategory === 'new') {
    renderNewCategoryForm();
  } else if (state.editingCategory) {
    renderEditCategory();
  } else {
    renderCategoryList();
  }
}

// =============================================
// LISTA DE CATEGORÍAS
// =============================================
function renderCategoryList() {
  const container = document.getElementById('content-body');
  if (!container) return;

  const cats = getCategoryList();

  let html = `
    <div class="content-actions">
      <button class="btn btn-primary btn-sm" onclick="showNewCategoryForm()">
        + NUEVA CATEGORÍA
      </button>
      <button class="btn btn-ghost btn-sm" onclick="showImportModal()">
        IMPORTAR JSON
      </button>
    </div>
  `;

  if (cats.length === 0) {
    html += `
      <div class="empty-state">
        <p class="empty-emoji">📂</p>
        <p class="empty-text">No hay categorías</p>
        <p class="empty-hint">Creá una categoría o importá un JSON para empezar</p>
      </div>
    `;
  } else {
    html += '<div class="category-list-content">';
    cats.forEach(cat => {
      html += `
        <div class="category-item" onclick="editCategory('${cat.id}')">
          <span class="category-item-emoji">${cat.emoji}</span>
          <span class="category-item-name">${escapeHtml(cat.name)}</span>
          <span class="category-item-count">${cat.words.length}</span>
          <button class="category-item-delete" onclick="event.stopPropagation(); deleteCategoryConfirm('${cat.id}')">🗑️</button>
        </div>
      `;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

// =============================================
// NUEVA CATEGORÍA
// =============================================
function showNewCategoryForm() {
  state.editingCategory = 'new';
  state.newCategoryData = { name: '', emoji: '📝', words: [] };
  renderNewCategoryForm();
}

function renderNewCategoryForm() {
  const container = document.getElementById('content-body');
  if (!container) return;

  const data = state.newCategoryData;

  let html = `
    <div class="category-form">
      <div class="category-form-header">
        <button class="btn btn-ghost btn-sm" onclick="cancelNewCategory()">←</button>
        <h3 class="title-md">NUEVA CATEGORÍA</h3>
      </div>

      <div class="form-field">
        <label class="label">Nombre</label>
        <input type="text" class="form-input" id="cat-name-input" value="${escapeHtml(data.name)}"
               placeholder="Ej: Fútbol Argentino" maxlength="40" oninput="updateNewCatName(this.value)">
      </div>

      <div class="form-field">
        <label class="label">Emoji</label>
        <div class="emoji-picker">
          ${['⚽', '🎬', '🎵', '🍕', '🔬', '🎮', '📚', '🌍', '🎨', '🏆', '💻', '🎭', '🎪', '🎯', '📝'].map(e => `
            <button class="emoji-btn ${data.emoji === e ? 'selected' : ''}" onclick="selectNewCatEmoji('${e}')">${e}</button>
          `).join('')}
        </div>
      </div>

      <div class="form-field">
        <label class="label">PALABRAS (${data.words.length})</label>
        <div class="word-list-form" id="new-cat-words">
          ${data.words.map((w, i) => `
            <div class="word-item">
              <div class="word-item-content">
                <span class="word-item-text">${escapeHtml(w.word)}</span>
                ${w.hint ? `<span class="word-item-hint">${escapeHtml(w.hint)}</span>` : ''}
              </div>
              <button class="word-delete-btn" onclick="removeNewCatWord(${i})">✕</button>
            </div>
          `).join('')}
          ${data.words.length === 0 ? '<p class="text-muted" style="text-align:center;padding:16px;font-size:13px">Sin palabras. Agregá algunas abajo.</p>' : ''}
        </div>
        <div class="add-word-row">
          <input type="text" class="add-word-input" id="new-cat-word-input"
                 placeholder="Palabra..." maxlength="60" style="flex:2">
          <input type="text" class="add-word-input" id="new-cat-hint-input"
                 placeholder="Pista (opcional)..." maxlength="60" style="flex:2">
          <button class="btn btn-gold btn-sm" onclick="addNewCatWord()">+</button>
        </div>
        <p class="setup-hint">💡 La pista se le muestra al impostor para que sepa de qué se trata la palabra.</p>
      </div>

      <div class="form-field">
        <button class="bulk-toggle" onclick="toggleNewCatBulk()">
          IMPORTAR PALABRAS EN BULK <span id="new-cat-bulk-arrow">▸</span>
        </button>
        <div class="bulk-panel" id="new-cat-bulk-panel">
          <textarea class="bulk-textarea" id="new-cat-bulk-textarea"
                    placeholder='Una por línea, o JSON: [{"word":"Messi","hint":"Jugador"}]'></textarea>
          <button class="btn btn-sm btn-primary" onclick="importNewCatBulk()">IMPORTAR</button>
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="saveNewCategory()"
              ${!data.name || data.words.length < 2 ? 'disabled' : ''}>
        GUARDAR CATEGORÍA
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function updateNewCatName(val) {
  state.newCategoryData.name = val;
  const btn = document.querySelector('.category-form .btn-primary.btn-block');
  if (btn) btn.disabled = !val || state.newCategoryData.words.length < 2;
}

function selectNewCatEmoji(emoji) {
  state.newCategoryData.emoji = emoji;
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent === emoji);
  });
}

function addNewCatWord() {
  const wordInput = document.getElementById('new-cat-word-input');
  const hintInput = document.getElementById('new-cat-hint-input');
  const word = wordInput.value.trim();
  const hint = hintInput.value.trim();
  if (!word) return;

  if (state.newCategoryData.words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
    showToast('Esa palabra ya existe', 'error');
    return;
  }

  state.newCategoryData.words.push({ id: generateWordId(), word: word, hint: hint });
  wordInput.value = '';
  hintInput.value = '';
  renderNewCategoryForm();
}

function removeNewCatWord(index) {
  state.newCategoryData.words.splice(index, 1);
  renderNewCategoryForm();
}

function toggleNewCatBulk() {
  const panel = document.getElementById('new-cat-bulk-panel');
  const arrow = document.getElementById('new-cat-bulk-arrow');
  panel.classList.toggle('open');
  arrow.textContent = panel.classList.contains('open') ? '▾' : '▸';
}

function importNewCatBulk() {
  const textarea = document.getElementById('new-cat-bulk-textarea');
  const text = textarea.value.trim();
  if (!text) return;

  let words = [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      words = parsed.map(w => {
        if (typeof w === 'string') return { word: w, hint: '' };
        return { word: w.word || '', hint: w.hint || '' };
      }).filter(w => w.word);
    }
  } catch (e) {
    // Líneas simples
    words = text.split('\n').map(w => ({ word: w.trim(), hint: '' })).filter(w => w.word);
  }

  let added = 0;
  words.forEach(w => {
    if (!state.newCategoryData.words.some(exist => exist.word.toLowerCase() === w.word.toLowerCase())) {
      state.newCategoryData.words.push({ id: generateWordId(), word: w.word, hint: w.hint });
      added++;
    }
  });

  textarea.value = '';
  showToast(`✓ ${added} palabras agregadas`, 'success');
  renderNewCategoryForm();
}

function saveNewCategory() {
  const data = state.newCategoryData;
  if (!data.name || data.words.length < 2) {
    showToast('Necesitás nombre y al menos 2 palabras', 'error');
    return;
  }

  const id = createCategory(data.name, data.emoji);
  categories[id].words = data.words;
  saveCategories();

  state.editingCategory = null;
  state.newCategoryData = null;
  showToast('✓ Categoría creada', 'success');
  renderContentManager();
}

function cancelNewCategory() {
  state.editingCategory = null;
  state.newCategoryData = null;
  renderContentManager();
}

// =============================================
// EDITAR CATEGORÍA
// =============================================
function editCategory(catId) {
  state.editingCategory = catId;
  renderEditCategory();
}

function renderEditCategory() {
  const container = document.getElementById('content-body');
  if (!container) return;

  const cat = getCategoryById(state.editingCategory);
  if (!cat) {
    state.editingCategory = null;
    renderContentManager();
    return;
  }

  let html = `
    <div class="category-form">
      <div class="category-form-header">
        <button class="btn btn-ghost btn-sm" onclick="cancelEditCategory()">←</button>
        <h3 class="title-md">EDITAR: ${cat.emoji} ${escapeHtml(cat.name)}</h3>
      </div>

      <div class="form-field">
        <label class="label">Nombre</label>
        <input type="text" class="form-input" id="edit-cat-name" value="${escapeHtml(cat.name)}"
               maxlength="40">
      </div>

      <div class="form-field">
        <label class="label">Emoji</label>
        <div class="emoji-picker">
          ${['⚽', '🎬', '🎵', '🍕', '🔬', '🎮', '📚', '🌍', '🎨', '🏆', '💻', '🎭', '🎪', '🎯', '📝'].map(e => `
            <button class="emoji-btn ${cat.emoji === e ? 'selected' : ''}" onclick="selectEditCatEmoji('${e}')">${e}</button>
          `).join('')}
        </div>
      </div>

      <div class="form-field">
        <label class="label">PALABRAS (${cat.words.length})</label>
        <div class="word-list-form" id="edit-cat-words">
          ${cat.words.map(w => `
            <div class="word-item">
              <div class="word-item-content">
                <span class="word-item-text">${escapeHtml(w.word)}</span>
                ${w.hint ? `<span class="word-item-hint">${escapeHtml(w.hint)}</span>` : ''}
              </div>
              <button class="word-delete-btn" onclick="deleteEditCatWord('${w.id}')">✕</button>
            </div>
          `).join('')}
          ${cat.words.length === 0 ? '<p class="text-muted" style="text-align:center;padding:16px;font-size:13px">Sin palabras.</p>' : ''}
        </div>
        <div class="add-word-row">
          <input type="text" class="add-word-input" id="edit-cat-word-input"
                 placeholder="Palabra..." maxlength="60" style="flex:2">
          <input type="text" class="add-word-input" id="edit-cat-hint-input"
                 placeholder="Pista..." maxlength="60" style="flex:2">
          <button class="btn btn-gold btn-sm" onclick="addEditCatWord()">+</button>
        </div>
      </div>

      <div class="form-field">
        <button class="bulk-toggle" onclick="toggleEditCatBulk()">
          IMPORTAR / EXPORTAR <span id="edit-cat-bulk-arrow">▸</span>
        </button>
        <div class="bulk-panel" id="edit-cat-bulk-panel">
          <textarea class="bulk-textarea" id="edit-cat-bulk-textarea"
                    placeholder='[{"word":"Messi","hint":"Jugador"}, ...]'></textarea>
          <div class="bulk-actions">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick="importEditCatBulk()">IMPORTAR</button>
            <button class="btn btn-sm btn-ghost" style="flex:1" onclick="exportEditCatBulk()">EXPORTAR</button>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="saveEditCategory()">GUARDAR</button>
        <button class="btn btn-ghost" style="flex:1;color:var(--accent)" onclick="deleteCategoryConfirm('${cat.id}')">ELIMINAR</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function selectEditCatEmoji(emoji) {
  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent === emoji);
  });
}

function addEditCatWord() {
  const wordInput = document.getElementById('edit-cat-word-input');
  const hintInput = document.getElementById('edit-cat-hint-input');
  const word = wordInput.value.trim();
  const hint = hintInput.value.trim();
  if (!word) return;

  if (addWordToCategory(state.editingCategory, word, hint)) {
    wordInput.value = '';
    hintInput.value = '';
    renderEditCategory();
  } else {
    showToast('Esa palabra ya existe', 'error');
  }
}

function deleteEditCatWord(wordId) {
  deleteWordFromCategory(state.editingCategory, wordId);
  renderEditCategory();
}

function toggleEditCatBulk() {
  const panel = document.getElementById('edit-cat-bulk-panel');
  const arrow = document.getElementById('edit-cat-bulk-arrow');
  panel.classList.toggle('open');
  arrow.textContent = panel.classList.contains('open') ? '▾' : '▸';
}

function importEditCatBulk() {
  const textarea = document.getElementById('edit-cat-bulk-textarea');
  const text = textarea.value.trim();
  if (!text) return;

  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      let added = 0;
      data.forEach(item => {
        const word = typeof item === 'string' ? item : item.word;
        const hint = typeof item === 'string' ? '' : (item.hint || '');
        if (word && addWordToCategory(state.editingCategory, word, hint)) added++;
      });
      textarea.value = '';
      showToast(`✓ ${added} palabras importadas`, 'success');
      renderEditCategory();
    }
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

function exportEditCatBulk() {
  const cat = getCategoryById(state.editingCategory);
  if (!cat) return;

  const json = JSON.stringify(cat.words.map(w => ({ word: w.word, hint: w.hint || '' })), null, 2);
  document.getElementById('edit-cat-bulk-textarea').value = json;
  showToast('JSON exportado', 'success');
}

function saveEditCategory() {
  const name = document.getElementById('edit-cat-name').value.trim();
  const emojiBtn = document.querySelector('.emoji-btn.selected');
  const emoji = emojiBtn ? emojiBtn.textContent : '📝';

  if (!name) {
    showToast('El nombre es obligatorio', 'error');
    return;
  }

  updateCategory(state.editingCategory, { name, emoji });
  showToast('✓ Categoría actualizada', 'success');
  cancelEditCategory();
}

function cancelEditCategory() {
  state.editingCategory = null;
  renderContentManager();
}

function deleteCategoryConfirm(catId) {
  if (!confirm('¿Eliminar esta categoría y todas sus palabras?')) return;
  deleteCategory(catId);
  state.editingCategory = null;
  showToast('Categoría eliminada', 'success');
  renderContentManager();
}

// =============================================
// IMPORT MODAL
// =============================================
function showImportModal() {
  const container = document.getElementById('content-body');
  if (!container) return;

  let html = `
    <div class="category-form">
      <div class="category-form-header">
        <button class="btn btn-ghost btn-sm" onclick="renderContentManager()">←</button>
        <h3 class="title-md">IMPORTAR JSON</h3>
      </div>

      <div class="form-field">
        <button class="btn btn-primary btn-block" onclick="triggerFileUpload()">
          📄 SUBIR ARCHIVO .JSON
        </button>
        <p class="setup-hint" style="margin-top:8px">ó pegá el JSON acá abajo:</p>
        <textarea class="bulk-textarea" id="import-json-textarea" style="height:150px;margin-top:8px"
                  placeholder='[{"word":"Messi","hint":"Jugador"}, ...]'></textarea>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="importFromModal()">IMPORTAR TEXTO</button>
        <button class="btn btn-ghost" style="flex:1" onclick="downloadJSON()">⬇ DESCARGAR</button>
      </div>

      <p class="bulk-hint">
        Formatos soportados:<br>
        • [{"word":"Messi","hint":"Jugador"}, ...]<br>
        • [{"category":"Fútbol","word":"Messi"}, ...]<br>
        • {"version":2,"categories":[...]}
      </p>
    </div>
  `;

  container.innerHTML = html;
}

function importFromModal() {
  const textarea = document.getElementById('import-json-textarea');
  const result = importCategoriesJSON(textarea.value);
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) renderContentManager();
}

// =============================================
// FILE UPLOAD / DOWNLOAD
// =============================================
function triggerFileUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const result = importCategoriesJSON(content);
        showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) renderContentManager();
      } catch (err) {
        showToast('Error al leer el archivo', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Error al leer el archivo', 'error');
    };
    reader.readAsText(file);
  };
  input.click();
}

function downloadJSON() {
  const data = {
    version: 2,
    categories: Object.values(categories).map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      words: cat.words.map(w => ({
        word: w.word,
        hint: w.hint || ''
      }))
    }))
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'impostor-categorias.json';
  a.click();

  URL.revokeObjectURL(url);
  showToast('Archivo descargado', 'success');
}