// =============================================
// BASE DE DATOS v2 — CATEGORÍAS VACÍAS
// =============================================
let categories = {};

// =============================================
// IDs
// =============================================
function generateCategoryId() {
  return 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function generateWordId() {
  return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

// =============================================
// CARGA / GUARDADO
// =============================================
function loadCategories() {
  try {
    const saved = localStorage.getItem('impostor_v2_categories');
    if (saved) {
      categories = JSON.parse(saved);
      Object.keys(categories).forEach(catId => {
        const cat = categories[catId];
        if (!cat.id) cat.id = catId;
        if (!cat.words) cat.words = [];
        // Migrar palabras string a objetos con hint
        cat.words = cat.words.map((w, i) => {
          if (typeof w === 'string') return { id: catId + '_' + i, word: w, hint: '' };
          if (!w.hint) w.hint = '';
          return w;
        });
      });
    }
  } catch (e) {
    categories = {};
  }
}

function saveCategories() {
  try {
    localStorage.setItem('impostor_v2_categories', JSON.stringify(categories));
  } catch (e) { /* ignore */ }
}

function loadPlayerNames() {
  try {
    const saved = localStorage.getItem('impostor_v2_playerNames');
    if (saved) state.playerNames = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

function savePlayerNames() {
  try {
    localStorage.setItem('impostor_v2_playerNames', JSON.stringify(state.playerNames));
  } catch (e) { /* ignore */ }
}

function loadLastConfig() {
  try {
    const saved = localStorage.getItem('impostor_v2_lastConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      // No cargar impostorMode ya que se eliminó
      delete parsed.impostorMode;
      Object.assign(state.config, parsed);
    }
  } catch (e) { /* ignore */ }
}

function saveLastConfig() {
  try {
    localStorage.setItem('impostor_v2_lastConfig', JSON.stringify(state.config));
  } catch (e) { /* ignore */ }
}

function loadScores() {
  try {
    const saved = localStorage.getItem('impostor_v2_scores');
    if (saved) state.scores = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

function saveScores() {
  try {
    if (Object.keys(state.scores).length > 0) {
      localStorage.setItem('impostor_v2_scores', JSON.stringify(state.scores));
    }
  } catch (e) { /* ignore */ }
}

// =============================================
// UTILIDADES DE CATEGORÍAS
// =============================================
function getCategoryList() {
  return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
}

function getCategoryById(id) {
  return categories[id] || null;
}

function createCategory(name, emoji) {
  const id = generateCategoryId();
  categories[id] = {
    id: id,
    name: name,
    emoji: emoji || '📝',
    words: []
  };
  saveCategories();
  return id;
}

function updateCategory(id, data) {
  if (!categories[id]) return false;
  Object.assign(categories[id], data);
  saveCategories();
  return true;
}

function deleteCategory(id) {
  if (!categories[id]) return false;
  delete categories[id];
  saveCategories();
  return true;
}

function addWordToCategory(catId, word, hint) {
  const cat = categories[catId];
  if (!cat) return false;
  if (cat.words.some(w => w.word.toLowerCase() === word.toLowerCase())) return false;
  cat.words.push({ id: generateWordId(), word: word, hint: hint || '' });
  saveCategories();
  return true;
}

function deleteWordFromCategory(catId, wordId) {
  const cat = categories[catId];
  if (!cat) return false;
  cat.words = cat.words.filter(w => w.id !== wordId);
  saveCategories();
  return true;
}

function updateWordHint(catId, wordId, hint) {
  const cat = categories[catId];
  if (!cat) return false;
  const word = cat.words.find(w => w.id === wordId);
  if (!word) return false;
  word.hint = hint;
  saveCategories();
  return true;
}

// =============================================
// IMPORT / EXPORT
// =============================================
function exportAllCategories() {
  const data = {
    version: 2,
    categories: Object.values(categories).map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      words: cat.words.map(w => ({ word: w.word, hint: w.hint || '' }))
    }))
  };
  return JSON.stringify(data, null, 2);
}

function importCategoriesJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    // Formato completo v2
    if (data.version && data.categories) {
      let imported = 0;
      data.categories.forEach(catData => {
        const id = createCategory(catData.name, catData.emoji);
        (catData.words || []).forEach(w => {
          if (typeof w === 'string') {
            addWordToCategory(id, w, '');
          } else {
            addWordToCategory(id, w.word, w.hint || '');
          }
        });
        imported++;
      });
      return { success: true, message: `✓ ${imported} categorías importadas` };
    }

    // Formato array: [{"word":"Messi","hint":"Jugador"}] o [{"category":"Fútbol","word":"Messi"}]
    if (Array.isArray(data)) {
      let imported = 0;
      let skipped = 0;
      let defaultCatId = null;

      data.forEach(item => {
        const word = item.word;
        if (!word) { skipped++; return; }

        let catId = null;
        if (item.category) {
          const existing = Object.values(categories).find(
            c => c.name.toLowerCase() === item.category.toLowerCase()
          );
          if (existing) {
            catId = existing.id;
          } else {
            catId = createCategory(item.category, item.emoji || '📝');
          }
        } else {
          if (!defaultCatId) {
            const cats = Object.values(categories);
            if (cats.length > 0) {
              defaultCatId = cats[0].id;
            } else {
              defaultCatId = createCategory('Sin categoría', '📝');
            }
          }
          catId = defaultCatId;
        }

        if (addWordToCategory(catId, word, item.hint || '')) {
          imported++;
        } else {
          skipped++;
        }
      });

      return {
        success: true,
        message: `✓ ${imported} palabras importadas${skipped > 0 ? ` · ${skipped} duplicadas` : ''}`
      };
    }

    return { success: false, message: 'Formato JSON no reconocido' };
  } catch (e) {
    return { success: false, message: 'Error: ' + e.message };
  }
}