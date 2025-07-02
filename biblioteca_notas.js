// Funciones para Notas y Resaltados (copia de app.js)
function getAllVerseData() {
    const data = localStorage.getItem('bibleNotesAndHighlights');
    return data ? JSON.parse(data) : {};
}

function saveAllVerseData(data) {
    localStorage.setItem('bibleNotesAndHighlights', JSON.stringify(data));
}

// Elementos del DOM para la biblioteca de notas
const notesContainer = document.getElementById('notes-container');
const loadingMessage = document.getElementById('loading-message');
const noNotesMessage = document.getElementById('no-notes-message');
const backToFinderBtn = document.getElementById('back-to-finder-btn');
const statusBar = document.getElementById('status-bar');

// Elementos del Modal de Notas (reutilizados del index.html, pero con su propia lógica de modal aquí)
const noteModalOverlay = document.getElementById('note-modal-overlay');
const closeModalBtn = document.querySelector('.close-button');
const modalVerseRef = document.getElementById('modal-verse-ref');
const noteTextArea = document.getElementById('note-text-area');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');

let currentVerseForNoteModal = null; // Para saber qué versículo estamos editando en el modal


// --- Funciones del Modal (copia adaptada de app.js) ---

function openNoteModal(verseId) {
    currentVerseForNoteModal = verseId;
    // Formatear el ID del versículo para el título del modal (ej. "Génesis_1_1" -> "Génesis 1:1")
    const formattedRef = verseId.replace(/_/g, ' ').replace(' ', ':');
    modalVerseRef.textContent = `Nota para: ${formattedRef}`;
    
    const allData = getAllVerseData();
    const verseData = allData[currentVerseForNoteModal];

    if (verseData && verseData.note) {
        noteTextArea.value = verseData.note;
        deleteNoteBtn.style.display = 'inline-block'; // Mostrar botón de eliminar si hay nota
    } else {
        noteTextArea.value = '';
        deleteNoteBtn.style.display = 'none'; // Ocultar si no hay nota
    }
    noteModalOverlay.style.display = 'flex'; // Mostrar el modal
}

function closeNoteModal() {
    noteModalOverlay.style.display = 'none';
    currentVerseForNoteModal = null;
    noteTextArea.value = '';
    deleteNoteBtn.style.display = 'none';
    loadNotesAndHighlights(); // Recargar la lista después de cerrar el modal
}

function saveNote() {
    if (!currentVerseForNoteModal) return;

    const noteText = noteTextArea.value.trim();
    const allData = getAllVerseData();

    if (noteText) {
        if (!allData[currentVerseForNoteModal]) {
            allData[currentVerseForNoteModal] = {};
        }
        allData[currentVerseForNoteModal].note = noteText;
    } else {
        if (allData[currentVerseForNoteModal]) {
            delete allData[currentVerseForNoteModal].note;
            if (!allData[currentVerseForNoteModal].highlighted) {
                delete allData[currentVerseForNoteModal];
            }
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    setStatus('Nota guardada.');
}

function deleteNote() {
    if (!currentVerseForNoteModal) return;

    const allData = getAllVerseData();
    if (allData[currentVerseForNoteModal]) {
        delete allData[currentVerseForNoteModal].note;
        if (!allData[currentVerseForNoteModal].highlighted) {
            delete allData[currentVerseForNoteModal];
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    setStatus('Nota eliminada.');
}

function toggleHighlightFromBiblioteca(verseId) {
    const allData = getAllVerseData();

    if (!allData[verseId]) {
        allData[verseId] = { highlighted: true };
    } else {
        allData[verseId].highlighted = !allData[verseId].highlighted;
        if (!allData[verseId].highlighted && !allData[verseId].note) {
            delete allData[verseId];
        }
    }
    saveAllVerseData(allData);
    loadNotesAndHighlights(); // Recargar la lista para que se actualice el estado
    setStatus(allData[verseId] && allData[verseId].highlighted ? 'Versículo resaltado.' : 'Resaltado quitado.');
}


// --- Lógica principal para cargar y mostrar notas ---

function loadNotesAndHighlights() {
    loadingMessage.style.display = 'block';
    noNotesMessage.style.display = 'none';
    notesContainer.innerHTML = ''; // Limpiar contenedor

    const allVerseData = getAllVerseData();
    const sortedVerseIds = Object.keys(allVerseData).sort((a, b) => {
        // Simple sorting for demonstration:
        // You might want a more sophisticated sort (by book order, then chapter, then verse)
        // This sorts alphabetically by string ID
        return a.localeCompare(b);
    });

    if (sortedVerseIds.length === 0) {
        loadingMessage.style.display = 'none';
        noNotesMessage.style.display = 'block';
        setStatus('No hay notas ni resaltados guardados.');
        return;
    }

    let notesHtml = '';
    sortedVerseIds.forEach(verseId => {
        const data = allVerseData[verseId];
        
        let typeClass = '';
        let typeLabel = '';
        if (data.note && data.highlighted) {
            typeClass = 'type-both';
            typeLabel = 'Nota y Resaltado';
        } else if (data.note) {
            typeClass = 'type-note';
            typeLabel = 'Nota';
        } else if (data.highlighted) {
            typeClass = 'type-highlight';
            typeLabel = 'Resaltado';
        }

        // Formatear el ID del versículo para mostrar
        const formattedRef = verseId.replace(/_/g, ' ').replace(' ', ':'); // Ej: "Génesis_1_1" -> "Génesis 1:1"

        notesHtml += `
            <div class="note-item">
                <div class="note-item-header">
                    <span class="note-item-ref" data-verse-id="${verseId}">${formattedRef}</span>
                    <span class="note-item-type ${typeClass}">${typeLabel}</span>
                </div>
                ${data.note ? `<p class="note-item-text">${data.note}</p>` : ''}
                <div class="note-item-actions">
                    <button class="neon-button note-item-edit-btn" data-verse-id="${verseId}">Editar Nota</button>
                    <button class="neon-button note-item-highlight-toggle-btn ${data.highlighted ? '' : 'highlighted-off'}" data-verse-id="${verseId}">
                        ${data.highlighted ? 'Quitar Resaltado' : 'Resaltar'}
                    </button>
                    <button class="neon-button note-item-delete-btn" data-verse-id="${verseId}">Eliminar Todo</button>
                </div>
            </div>
        `;
    });

    notesContainer.innerHTML = notesHtml;
    loadingMessage.style.display = 'none';
    addNoteItemListeners(); // Añadir listeners a los nuevos elementos
    setStatus(`Mostrando ${sortedVerseIds.length} notas y resaltados.`);
}

function setStatus(message) {
    statusBar.textContent = message;
}

// --- Event Listeners ---

// Botón "Volver al Buscador"
backToFinderBtn.addEventListener('click', () => {
    // Redirige a la página principal del buscador
    window.location.href = 'index.html'; 
});

// Event Listeners del Modal de Notas (para esta página)
closeModalBtn.addEventListener('click', closeNoteModal);
saveNoteBtn.addEventListener('click', saveNote);
deleteNoteBtn.addEventListener('click', deleteNote);
noteModalOverlay.addEventListener('click', (event) => {
    if (event.target === noteModalOverlay) {
        closeNoteModal();
    }
});


// Añadir Event Listeners a los elementos dinámicamente creados
function addNoteItemListeners() {
    document.querySelectorAll('.note-item-ref').forEach(refElement => {
        refElement.onclick = (event) => {
            const verseId = event.target.dataset.verseId;
            // Redirige al buscador y pasa los parámetros del versículo
            const [book, chapter, verse] = verseId.split('_');
            window.location.href = `index.html?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`;
        };
    });

    document.querySelectorAll('.note-item-edit-btn').forEach(button => {
        button.onclick = (event) => {
            const verseId = event.target.dataset.verseId;
            openNoteModal(verseId);
        };
    });

    document.querySelectorAll('.note-item-highlight-toggle-btn').forEach(button => {
        button.onclick = (event) => {
            const verseId = event.target.dataset.verseId;
            toggleHighlightFromBiblioteca(verseId);
        };
    });

    document.querySelectorAll('.note-item-delete-btn').forEach(button => {
        button.onclick = (event) => {
            const verseId = event.target.dataset.verseId;
            if (confirm(`¿Estás seguro de que quieres eliminar la nota y el resaltado para ${verseId.replace(/_/g, ' ').replace(' ', ':')}?`)) {
                const allData = getAllVerseData();
                delete allData[verseId];
                saveAllVerseData(allData);
                loadNotesAndHighlights(); // Recargar la lista después de eliminar
                setStatus('Nota y resaltado eliminados.');
            }
        };
    });
}


// Cargar las notas y resaltados al cargar la página
document.addEventListener('DOMContentLoaded', loadNotesAndHighlights);