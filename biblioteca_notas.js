document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');
    const loadingMessage = document.getElementById('loading-message');
    const backToMainBtn = document.getElementById('back-to-main-btn');

    function getAllVerseData() {
        const data = localStorage.getItem('bibleNotesAndHighlights');
        return data ? JSON.parse(data) : {};
    }

    function saveAllVerseData(data) {
        localStorage.setItem('bibleNotesAndHighlights', JSON.stringify(data));
    }

    function deleteNoteOrHighlight(verseId) {
        let allData = getAllVerseData();
        if (confirm(`¿Estás seguro de que quieres eliminar esta entrada para ${allData[verseId].reference}?`)) {
            delete allData[verseId];
            saveAllVerseData(allData);
            displayNotesAndHighlights();
        }
    }

    function deleteOnlyNote(verseId) {
        let allData = getAllVerseData();
        if (allData[verseId] && allData[verseId].note) {
            if (confirm(`¿Estás seguro de que quieres eliminar solo la nota para ${allData[verseId].reference}?`)) {
                delete allData[verseId].note;
                if (!allData[verseId].highlighted) {
                    delete allData[verseId];
                }
                saveAllVerseData(allData);
                displayNotesAndHighlights();
            }
        }
    }

    function deleteOnlyHighlight(verseId) {
        let allData = getAllVerseData();
        if (allData[verseId] && allData[verseId].highlighted) {
            if (confirm(`¿Estás seguro de que quieres eliminar solo el resaltado para ${allData[verseId].reference}?`)) {
                delete allData[verseId].highlighted;
                if (!allData[verseId].note) {
                    delete allData[verseId];
                }
                saveAllVerseData(allData);
                displayNotesAndHighlights();
            }
        }
    }

    // Modificado: displayNotesAndHighlights para mostrar el texto del versículo
    function displayNotesAndHighlights() {
        const allData = getAllVerseData();
        let htmlContent = '';
        let hasContent = false;

        const sortedVerseIds = Object.keys(allData).sort((a, b) => {
            const [bookA, chapterA, verseA] = a.split('_');
            const [bookB, chapterB, verseB] = b.split('_');

            if (bookA !== bookB) return bookA.localeCompare(bookB);
            if (parseInt(chapterA) !== parseInt(chapterB)) return parseInt(chapterA) - parseInt(chapterB);
            return parseInt(verseA) - parseInt(verseB);
        });

        if (sortedVerseIds.length > 0) {
            hasContent = true;
            sortedVerseIds.forEach(verseId => {
                const data = allData[verseId];
                const reference = data.reference;
                const note = data.note;
                const highlighted = data.highlighted;
                const verseText = data.verseText || "Texto del versículo no disponible."; // NUEVO: Obtener el texto del versículo

                htmlContent += `
                    <div class="note-entry ${highlighted ? 'highlighted-entry-border' : ''}">
                        <h3>${reference}</h3>
                        <p class="displayed-verse-text">"${verseText}"</p> `;

                if (note) {
                    htmlContent += `
                        <p class="note-text"><strong>Tu Nota:</strong> ${note}</p>
                    `;
                }

                htmlContent += `
                        <div class="action-buttons">
                `;
                if (note) {
                    htmlContent += `
                            <button class="edit-btn" data-verse-id="${verseId}" data-type="note">Editar Nota</button>
                            <button class="delete-btn" data-verse-id="${verseId}" data-type="note-only">Eliminar Solo Nota</button>
                    `;
                }
                if (highlighted) {
                    htmlContent += `
                            <button class="unhighlight-btn" data-verse-id="${verseId}" data-type="highlight-only">Quitar Resaltado</button>
                    `;
                }
                // Si la entrada puede ser completamente eliminada (sin nota ni resaltado, o solo una de ellas)
                if (!note || !highlighted) { // Si no tiene nota O no tiene resaltado (es decir, una de las dos ya está ausente o ambas)
                     htmlContent += `
                            <button class="delete-btn" data-verse-id="${verseId}" data-type="all">Eliminar Entrada Completa</button>
                     `;
                }
                htmlContent += `
                        </div>
                    </div>
                `;
            });
        }

        if (!hasContent) {
            notesList.innerHTML = '<p class="empty-message">No tienes notas o resaltados guardados aún. ¡Vuelve a la página principal y empieza a usarlos!</p>';
        } else {
            notesList.innerHTML = htmlContent;
        }

        addNotesPageActionListeners();
    }

    function addNotesPageActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const verseId = event.target.dataset.verseId;
                const [book, chapter, verse] = verseId.split('_');
                sessionStorage.setItem('loadVerseOnStart', JSON.stringify({ book, chapter, verse }));
                window.location.href = 'index.html';
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const verseId = event.target.dataset.verseId;
                const type = event.target.dataset.type;
                if (type === 'all') {
                    deleteNoteOrHighlight(verseId);
                } else if (type === 'note-only') {
                    deleteOnlyNote(verseId);
                }
            });
        });

        document.querySelectorAll('.unhighlight-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const verseId = event.target.dataset.verseId;
                deleteOnlyHighlight(verseId);
            });
        });
    }

    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }

    displayNotesAndHighlights();
});