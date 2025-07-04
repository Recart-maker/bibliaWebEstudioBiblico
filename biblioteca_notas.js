document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');
    const loadingMessage = document.getElementById('loading-message');
    const backToMainBtn = document.getElementById('back-to-main-btn');

    // Función para obtener todos los datos de notas/resaltados de localStorage
    function getAllVerseData() {
        const data = localStorage.getItem('bibleNotesAndHighlights');
        return data ? JSON.parse(data) : {};
    }

    // Función para guardar todos los datos de notas/resaltados en localStorage
    function saveAllVerseData(data) {
        localStorage.setItem('bibleNotesAndHighlights', JSON.stringify(data));
    }

    // Función para eliminar una nota/resaltado específico
    function deleteNoteOrHighlight(verseId) {
        let allData = getAllVerseData();
        if (confirm(`¿Estás seguro de que quieres eliminar esta entrada para ${allData[verseId].reference}?`)) {
            delete allData[verseId];
            saveAllVerseData(allData);
            displayNotesAndHighlights(); // Volver a mostrar la lista actualizada
        }
    }

    // Función para eliminar solo la nota, manteniendo el resaltado si existe
    function deleteOnlyNote(verseId) {
        let allData = getAllVerseData();
        if (allData[verseId] && allData[verseId].note) {
            if (confirm(`¿Estás seguro de que quieres eliminar solo la nota para ${allData[verseId].reference}?`)) {
                delete allData[verseId].note;
                // Si ya no hay ni nota ni resaltado, eliminar la entrada completa
                if (!allData[verseId].highlighted) {
                    delete allData[verseId];
                }
                saveAllVerseData(allData);
                displayNotesAndHighlights();
            }
        }
    }

    // Función para eliminar solo el resaltado, manteniendo la nota si existe
    function deleteOnlyHighlight(verseId) {
        let allData = getAllVerseData();
        if (allData[verseId] && allData[verseId].highlighted) {
            if (confirm(`¿Estás seguro de que quieres eliminar solo el resaltado para ${allData[verseId].reference}?`)) {
                delete allData[verseId].highlighted;
                // Si ya no hay ni nota ni resaltado, eliminar la entrada completa
                if (!allData[verseId].note) {
                    delete allData[verseId];
                }
                saveAllVerseData(allData);
                displayNotesAndHighlights();
            }
        }
    }

    // Función para mostrar todas las notas y resaltados
    function displayNotesAndHighlights() {
        const allData = getAllVerseData();
        let htmlContent = '';
        let hasContent = false;

        // Convertir el objeto a un array y ordenar por referencia para una mejor visualización
        const sortedVerseIds = Object.keys(allData).sort((a, b) => {
            // Ejemplo de ordenamiento: libro, luego capítulo, luego versículo
            const [bookA, chapterA, verseA] = a.split('_');
            const [bookB, chapterB, verseB] = b.split('_');

            // Podrías necesitar un mapeo de nombres de libros a números para ordenar correctamente
            // Por ahora, solo ordena alfabéticamente por libro, luego numéricamente por capítulo y versículo
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

                if (note) {
                    htmlContent += `
                        <div class="note-entry">
                            <h3>Nota para ${reference}</h3>
                            <p class="note-text">${note}</p>
                            <div class="action-buttons">
                                <button class="edit-btn" data-verse-id="${verseId}" data-type="note">Editar Nota</button>
                                <button class="delete-btn" data-verse-id="${verseId}" data-type="note-only">Eliminar Solo Nota</button>
                                <button class="delete-btn" data-verse-id="${verseId}" data-type="all">Eliminar Toda Entrada</button>
                            </div>
                        </div>
                    `;
                }

                if (highlighted && !note) { // Mostrar resaltado solo si no hay nota (ya que la nota incluye el resaltado visualmente en app.js)
                    htmlContent += `
                        <div class="highlight-entry">
                            <h3>Versículo Resaltado: ${reference}</h3>
                            <p class="highlight-text"><em>Este versículo está resaltado.</em></p>
                            <div class="action-buttons">
                                <button class="unhighlight-btn" data-verse-id="${verseId}" data-type="highlight-only">Quitar Resaltado</button>
                                <button class="delete-btn" data-verse-id="${verseId}" data-type="all">Eliminar Toda Entrada</button>
                            </div>
                        </div>
                    `;
                } else if (highlighted && note) { // Si hay nota y también está resaltado
                     htmlContent += `
                        <div class="highlight-entry">
                            <h3>Versículo con Nota y Resaltado: ${reference}</h3>
                            <p class="highlight-text"><em>(También está resaltado)</em></p>
                            <div class="action-buttons">
                                <button class="unhighlight-btn" data-verse-id="${verseId}" data-type="highlight-only">Quitar Resaltado</button>
                            </div>
                        </div>
                    `;
                }
            });
        }

        if (!hasContent) {
            notesList.innerHTML = '<p class="empty-message">No tienes notas o resaltados guardados aún. ¡Vuelve a la página principal y empieza a usarlos!</p>';
        } else {
            notesList.innerHTML = htmlContent;
        }

        // Añadir listeners a los nuevos botones (Editar, Eliminar, Quitar Resaltado)
        addNotesPageActionListeners();
    }

    function addNotesPageActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                // Para editar, redirigir al index.html y cargar el versículo
                const verseId = event.target.dataset.verseId;
                const [book, chapter, verse] = verseId.split('_');
                // Almacenar en sessionStorage para que index.html sepa qué cargar
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


    // Listener para el botón "Volver a la Biblia"
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Redirige a la página principal
        });
    }

    // Ocultar mensaje de carga y mostrar contenido
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }

    // Mostrar las notas y resaltados al cargar la página
    displayNotesAndHighlights();
});