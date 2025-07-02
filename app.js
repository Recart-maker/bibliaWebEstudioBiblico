const JSON_FILE_NAME = 'libros_biblia.json';
const INFO_FILE_NAME = 'resumen_libros.json';
let LIBROS_BIBLIA = [];
let BIBLIA_DATA = {};
let INFO_LIBROS = {};

// Referencias a los elementos del DOM
const libroCombo = document.getElementById('libro-combo');
const capituloEntry = document.getElementById('capitulo-entry');
const versiculoEntry = document.getElementById('versiculo-entry');
const buscarBtn = document.getElementById('buscar-btn');
const resultadoArea = document.getElementById('resultado-area');
const statusBar = document.getElementById('status-bar');

const capitulosInfo = document.getElementById('capitulos-info');
const versiculosInfo = document.getElementById('versiculos-info');

const prevCapituloBtn = document.getElementById('prev-capitulo-btn');
const nextCapituloBtn = document.getElementById('next-capitulo-btn');

const infoLibroArea = document.getElementById('info-libro-area');
const infoLibroTitulo = document.getElementById('info-libro-titulo');
const infoLibroAutor = document.getElementById('info-libro-autor');
const infoLibroTema = document.getElementById('info-libro-tema');
const infoLibroContexto = document.getElementById('info-libro-contexto');

const searchTextEntry = document.getElementById('search-text-entry');
const searchTextBtn = document.getElementById('search-text-btn');

const shareBtn = document.getElementById('share-btn');

// Elementos del Modal de Notas
const noteModalOverlay = document.getElementById('note-modal-overlay');
const closeModalBtn = document.querySelector('.close-button');
const modalVerseRef = document.getElementById('modal-verse-ref');
const noteTextArea = document.getElementById('note-text-area');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');

let currentVerseForNote = null; // Para saber qué versículo estamos editando/notando

// --- Funciones de Utilidad ---

function displayResult(htmlContent, append = false) {
    if (!append) {
        resultadoArea.innerHTML = '';
    }
    resultadoArea.innerHTML += htmlContent;
}

function setStatus(message) {
    statusBar.textContent = message;
}

// --- Funciones de Información de Capítulos/Versículos ---

function updateCapitulosInfo() {
    const libroNombreEspanol = libroCombo.value;
    if (libroNombreEspanol && BIBLIA_DATA[libroNombreEspanol]) {
        const numCapitulos = Object.keys(BIBLIA_DATA[libroNombreEspanol]).length;
        capitulosInfo.textContent = `Total de capítulos: ${numCapitulos}`;
    } else {
        capitulosInfo.textContent = '';
    }
    updateVersiculosInfo(); 
    displayBookInfo(); 
}

function updateVersiculosInfo() {
    const libroNombreEspanol = libroCombo.value;
    const capituloStr = capituloEntry.value;

    if (libroNombreEspanol && capituloStr && BIBLIA_DATA[libroNombreEspanol]) {
        const capitulo = String(parseInt(capituloStr));
        if (!isNaN(capitulo) && BIBLIA_DATA[libroNombreEspanol][capitulo]) {
            const numVersiculos = Object.keys(BIBLIA_DATA[libroNombreEspanol][capitulo]).length;
            versiculosInfo.textContent = `Total de versículos en el capítulo ${capitulo}: ${numVersiculos}`;
        } else {
            versiculosInfo.textContent = 'Capítulo no válido o no encontrado.';
        }
    } else {
        versiculosInfo.textContent = '';
    }
}

// --- Funciones de Navegación de Capítulos ---

function navigateCapitulo(direction) {
    let currentLibroIndex = LIBROS_BIBLIA.indexOf(libroCombo.value);
    let currentCapitulo = parseInt(capituloEntry.value);

    if (isNaN(currentCapitulo)) {
        const libroData = BIBLIA_DATA[libroCombo.value];
        if (libroData) {
            const capitulosDelLibro = Object.keys(libroData).map(Number).sort((a,b)=>a-b);
            currentCapitulo = capitulosDelLibro[0];
            capituloEntry.value = currentCapitulo;
        } else {
            setStatus('Seleccione un libro válido.');
            return;
        }
    }

    let nextCapitulo = currentCapitulo + direction;
    let libroData = BIBLIA_DATA[libroCombo.value];

    if (libroData) {
        let capitulosDelLibro = Object.keys(libroData).map(Number).sort((a,b)=>a-b);
        let minCapitulo = capitulosDelLibro[0];
        let maxCapitulo = capitulosDelLibro[capitulosDelLibro.length - 1];

        if (nextCapitulo >= minCapitulo && nextCapitulo <= maxCapitulo) {
            capituloEntry.value = nextCapitulo;
            versiculoEntry.value = '1';
            buscarVersiculo();
        } else {
            let nextLibroIndex = currentLibroIndex;
            if (direction === 1 && currentLibroIndex < LIBROS_BIBLIA.length - 1) {
                nextLibroIndex++;
            } else if (direction === -1 && currentLibroIndex > 0) {
                nextLibroIndex--;
            }

            if (nextLibroIndex !== currentLibroIndex) {
                libroCombo.value = LIBROS_BIBLIA[nextLibroIndex];
                libroData = BIBLIA_DATA[LIBROS_BIBLIA[nextLibroIndex]];
                capitulosDelLibro = Object.keys(libroData).map(Number).sort((a,b)=>a-b);

                if (direction === 1) {
                    capituloEntry.value = capitulosDelLibro[0];
                } else {
                    capituloEntry.value = capitulosDelLibro[capitulosDelLibro.length - 1];
                }
                versiculoEntry.value = '1';
                buscarVersiculo();
            } else {
                setStatus('Ya estás en el primer/último capítulo del primer/último libro.');
            }
        }
    }
}

// --- Función para mostrar la información del libro ---

function displayBookInfo() {
    const libroNombreEspanol = libroCombo.value;
    const info = INFO_LIBROS[libroNombreEspanol];

    if (info) {
        infoLibroTitulo.textContent = libroNombreEspanol;
        infoLibroAutor.textContent = info.autor || 'N/A';
        infoLibroTema.textContent = info.tema_principal || 'N/A';
        infoLibroContexto.textContent = info.contexto || 'N/A';
        infoLibroArea.style.display = 'block';
    } else {
        infoLibroArea.style.display = 'none';
    }
}

// --- Función de Búsqueda de Texto (AVANZADA) ---

function buscarTexto() {
    let searchText = searchTextEntry.value.trim();
    if (searchText.length < 3 && !searchText.includes('"')) {
        displayResult('<span class="error-text">Error: Ingrese al menos 3 caracteres para la búsqueda de texto, o use comillas para buscar una frase exacta.</span>', false);
        setStatus('Error: Búsqueda de texto muy corta.');
        return;
    }

    setStatus(`Buscando "${searchText}" en toda la Biblia...`);
    displayResult('<h2>Resultados de Búsqueda de Texto:</h2>', false);

    let coincidencias = 0;
    let includeTerms = [];
    let excludeTerms = [];
    let exactPhrase = null;

    const exactMatch = searchText.match(/"([^"]*)"/);
    if (exactMatch) {
        exactPhrase = exactMatch[1];
        searchText = searchText.replace(exactMatch[0], '').trim();
    }

    const terms = searchText.split(/\s+/);
    terms.forEach(term => {
        if (term.startsWith('-')) {
            excludeTerms.push(term.substring(1).toLowerCase());
        } else if (term.length > 0) {
            includeTerms.push(term.toLowerCase());
        }
    });

    let includeRegex = null;
    if (includeTerms.length > 0) {
        const pattern = includeTerms.map(term => exactPhrase ? term : `\\b${term}\\b`).join('|');
        includeRegex = new RegExp(pattern, 'gi');
    }

    let exactPhraseRegex = null;
    if (exactPhrase) {
        exactPhraseRegex = new RegExp(exactPhrase, 'gi');
    }

    let excludeRegex = null;
    if (excludeTerms.length > 0) {
        const pattern = excludeTerms.map(term => `\\b${term}\\b`).join('|');
        excludeRegex = new RegExp(pattern, 'gi');
    }

    for (const libroNombre of LIBROS_BIBLIA) { 
        const libroData = BIBLIA_DATA[libroNombre];
        if (libroData) {
            const capitulosOrdenados = Object.keys(libroData).map(Number).sort((a,b)=>a-b);
            for (const capituloNum of capitulosOrdenados) {
                const capituloData = libroData[String(capituloNum)]; 
                if (capituloData) {
                    const versiculosOrdenados = Object.keys(capituloData).map(Number).sort((a,b)=>a-b);
                    for (const versiculoNum of versiculosOrdenados) {
                        const textoVersiculo = capituloData[String(versiculoNum)]; 
                        const lowerCaseVerse = textoVersiculo.toLowerCase();

                        let matches = true;

                        if (exactPhraseRegex && !exactPhraseRegex.test(textoVersiculo)) {
                            matches = false;
                        }

                        if (matches && includeRegex) {
                            for (const term of includeTerms) {
                                if (!lowerCaseVerse.includes(term)) {
                                    matches = false;
                                    break;
                                }
                            }
                        }

                        if (matches && excludeRegex && excludeRegex.test(lowerCaseVerse)) {
                            matches = false;
                        }

                        if (matches) {
                            coincidencias++;
                            let highlightedText = textoVersiculo;
                            if (exactPhraseRegex) {
                                highlightedText = highlightedText.replace(exactPhraseRegex, (match) => `<span class="highlight">${match}</span>`);
                            }
                            if (includeRegex) {
                                highlightedText = highlightedText.replace(includeRegex, (match) => {
                                    if (match.includes('<span class="highlight">')) {
                                        return match;
                                    }
                                    return `<span class="highlight">${match}</span>`;
                                });
                            }
                            
                            // Nuevo: Obtener notas y resaltados para este versículo
                            const verseId = `${libroNombre}_${capituloNum}_${versiculoNum}`;
                            const verseData = getVerseData(verseId);
                            const noteHtml = verseData && verseData.note ? `<div class="verse-note"><button class="note-delete-button" data-verse-id="${verseId}">&times;</button><div class="verse-note-text">${verseData.note}</div></div>` : '';
                            const highlightClass = verseData && verseData.highlighted ? 'highlighted-verse' : '';

                            displayResult(
                                `<div class="verse-entry">` +
                                `<span class="verse-reference">${libroNombre} ${capituloNum}:${versiculoNum}` +
                                `<button class="action-button" data-action="note" data-book="${libroNombre}" data-chapter="${capituloNum}" data-verse="${versiculoNum}">✏️ Nota</button>` +
                                `<button class="action-button" data-action="highlight" data-book="${libroNombre}" data-chapter="${capituloNum}" data-verse="${versiculoNum}">✨ Resaltar</button>` +
                                `</span><br>` +
                                `<span class="verse-number">${versiculoNum}. </span><span class="verse-text ${highlightClass}">${highlightedText}</span>` +
                                `${noteHtml}</div><br>`,
                                true
                            );
                        }
                    }
                }
            }
        }
    }

    if (coincidencias === 0) {
        displayResult('<span class="error-text">No se encontraron coincidencias para su búsqueda.</span>', true);
        setStatus(`Búsqueda terminada: No se encontraron resultados para "${searchText}".`);
    } else {
        setStatus(`Búsqueda terminada: Se encontraron ${coincidencias} coincidencias para "${searchText}".`);
        resultadoArea.scrollTop = 0;
    }
    addActionButtonListeners(); // Añadir listeners a los nuevos botones
    addDeleteNoteButtonListeners(); // Añadir listeners para borrar notas
}


// --- Cargar datos desde los archivos JSON ---

async function loadBibleData() {
    try {
        const responseBiblia = await fetch(JSON_FILE_NAME);
        if (!responseBiblia.ok) {
            throw new Error(`No se encontró el archivo '${JSON_FILE_NAME}'. Asegúrate de que esté en el mismo directorio.`);
        }
        const dataBiblia = await responseBiblia.json();
        LIBROS_BIBLIA = dataBiblia.libros_biblia_espanol || [];
        BIBLIA_DATA = dataBiblia.biblia_data || {};

        const responseInfo = await fetch(INFO_FILE_NAME);
        if (!responseInfo.ok) {
            console.warn(`Advertencia: No se encontró el archivo '${INFO_FILE_NAME}'. La información del libro no estará disponible.`);
            INFO_LIBROS = {};
        } else {
            INFO_LIBROS = await responseInfo.json();
        }
        
        libroCombo.innerHTML = ''; 
        LIBROS_BIBLIA.forEach(libro => {
            const option = document.createElement('option');
            option.value = libro;
            option.textContent = libro;
            libroCombo.appendChild(option);
        });

        if (LIBROS_BIBLIA.length > 0) {
            libroCombo.value = LIBROS_BIBLIA[0];
            updateCapitulosInfo();
            displayBookInfo();
        }
        setStatus('Datos de la Biblia cargados exitosamente. Seleccione un pasaje y presione Buscar.');

    } catch (error) {
        displayResult(`<span class="error-text">Error de Carga: ${error.message}</span>`, false);
        setStatus(`Error al cargar datos: ${error.message}`);
        console.error("Error al cargar datos JSON:", error);
    }
}

// --- Función principal para buscar versículos (pasaje específico) ---

function buscarVersiculo() {
    const libroNombreEspanol = libroCombo.value;
    const capituloStr = capituloEntry.value;
    const versiculoInput = versiculoEntry.value;

    if (!libroNombreEspanol || !capituloStr || !versiculoInput) {
        displayResult('<span class="error-text">Error: Todos los campos (Libro, Capítulo, Versículo/Rango) son obligatorios.</span>', false);
        setStatus('Error: Campos obligatorios.');
        return;
    }

    const capitulo = String(parseInt(capituloStr));
    if (isNaN(capitulo)) {
        displayResult('<span class="error-text">Error: El capítulo debe ser un número válido.</span>', false);
        setStatus('Error: Capítulo inválido.');
        return;
    }

    let versiculosABuscar = [];
    if (versiculoInput.includes('-')) {
        const partes = versiculoInput.split('-');
        if (partes.length === 2) {
            try {
                const inicio = parseInt(partes[0].trim());
                const fin = parseInt(partes[1].trim());
                if (isNaN(inicio) || isNaN(fin) || inicio > fin) {
                    throw new Error("Rango de versículos inválido.");
                }
                for (let i = inicio; i <= fin; i++) {
                    versiculosABuscar.push(String(i));
                }
            } catch (e) {
                displayResult(`<span class="error-text">Error: El rango de versículos debe contener números válidos (ej. '1-4').</span>`, false);
                setStatus('Error: Rango de versículos inválido.');
                return;
            }
        } else {
            displayResult('<span class="error-text">Error: Formato de rango de versículos inválido (ej. \'1-4\').</span>', false);
            setStatus('Error: Formato de rango inválido.');
            return;
        }
    } else {
        try {
            const singleVerse = String(parseInt(versiculoInput.trim()));
            if (isNaN(singleVerse)) {
                throw new Error("Versículo inválido.");
            }
            versiculosABuscar.push(singleVerse);
        } catch (e) {
            displayResult('<span class="error-text">Error: El versículo debe ser un número válido.</span>', false);
            setStatus('Error: Versículo inválido.');
            return;
        }
    }

    const referenciaUsuarioBase = `${libroNombreEspanol} ${capitulo}`;
    setStatus(`Buscando ${referenciaUsuarioBase}:${versiculoInput} en datos locales...`);
    
    let htmlResultado = `<span class="verse-reference">Referencia: ${referenciaUsuarioBase}:${versiculoInput}</span><br><br>`;
    let versiculosEncontradosCount = 0;

    const libroData = BIBLIA_DATA[libroNombreEspanol];
    if (!libroData) {
        displayResult(`<span class="error-text">Libro '${libroNombreEspanol}' no encontrado en los datos locales.</span>`, false);
        setStatus('Error: Libro no encontrado localmente.');
        return;
    }

    const capituloData = libroData[capitulo];
    if (!capituloData) {
        displayResult(`<span class="error-text">Capítulo '${capitulo}' no encontrado en ${libroNombreEspanol} en los datos locales.</span>`, false);
        setStatus('Error: Capítulo no encontrado localmente.');
        return;
    }

    for (const vNumStr of versiculosABuscar) {
        const textoVersiculo = capituloData[vNumStr];
        if (textoVersiculo) {
            versiculosEncontradosCount++;
            // Nuevo: Obtener notas y resaltados para este versículo
            const verseId = `${libroNombreEspanol}_${capitulo}_${vNumStr}`;
            const verseData = getVerseData(verseId);
            const noteHtml = verseData && verseData.note ? `<div class="verse-note"><button class="note-delete-button" data-verse-id="${verseId}">&times;</button><div class="verse-note-text">${verseData.note}</div></div>` : '';
            const highlightClass = verseData && verseData.highlighted ? 'highlighted-verse' : '';

            htmlResultado += 
                `<div class="verse-entry">` +
                `<span class="verse-reference">${libroNombreEspanol} ${capitulo}:${vNumStr}` +
                `<button class="action-button" data-action="note" data-book="${libroNombreEspanol}" data-chapter="${capitulo}" data-verse="${vNumStr}">✏️ Nota</button>` +
                `<button class="action-button" data-action="highlight" data-book="${libroNombreEspanol}" data-chapter="${capitulo}" data-verse="${vNumStr}">✨ Resaltar</button>` +
                `</span><br>` +
                `<span class="verse-number">${vNumStr}. </span><span class="verse-text ${highlightClass}">${textoVersiculo}</span>` +
                `${noteHtml}</div><br>`;
        } else {
            htmlResultado += `<span class="error-text">Versículo '${vNumStr}' no encontrado en los datos locales.</span><br><br>`;
        }
    }

    displayResult(htmlResultado, false);

    if (versiculosEncontradosCount > 0) {
        setStatus(`Mostrando: ${referenciaUsuarioBase}:${versiculoInput}`);
    } else {
        setStatus('Error: No se encontraron versículos en el rango especificado.');
    }
    addActionButtonListeners(); // Añadir listeners a los nuevos botones
    addDeleteNoteButtonListeners(); // Añadir listeners para borrar notas
}

// --- Funciones para Notas y Resaltados ---

// Obtiene todos los datos de notas/resaltados de localStorage
function getAllVerseData() {
    const data = localStorage.getItem('bibleNotesAndHighlights');
    return data ? JSON.parse(data) : {};
}

// Guarda todos los datos de notas/resaltados en localStorage
function saveAllVerseData(data) {
    localStorage.setItem('bibleNotesAndHighlights', JSON.stringify(data));
}

// Obtiene los datos para un versículo específico
function getVerseData(verseId) {
    const allData = getAllVerseData();
    return allData[verseId];
}

// Abre el modal de notas
function openNoteModal(book, chapter, verse) {
    currentVerseForNote = `${book}_${chapter}_${verse}`;
    modalVerseRef.textContent = `Nota para: ${book} ${chapter}:${verse}`;
    
    const verseData = getVerseData(currentVerseForNote);
    if (verseData && verseData.note) {
        noteTextArea.value = verseData.note;
        deleteNoteBtn.style.display = 'inline-block'; // Mostrar botón de eliminar si hay nota
    } else {
        noteTextArea.value = '';
        deleteNoteBtn.style.display = 'none'; // Ocultar si no hay nota
    }
    noteModalOverlay.style.display = 'flex'; // Mostrar el modal
}

// Cierra el modal de notas
function closeNoteModal() {
    noteModalOverlay.style.display = 'none';
    currentVerseForNote = null;
    noteTextArea.value = '';
    deleteNoteBtn.style.display = 'none';
}

// Guarda la nota en localStorage
function saveNote() {
    if (!currentVerseForNote) return;

    const noteText = noteTextArea.value.trim();
    const allData = getAllVerseData();

    if (noteText) {
        // Asegurarse de que el objeto para el versículo exista
        if (!allData[currentVerseForNote]) {
            allData[currentVerseForNote] = {};
        }
        allData[currentVerseForNote].note = noteText;
    } else {
        // Si la nota está vacía, la eliminamos
        if (allData[currentVerseForNote]) {
            delete allData[currentVerseForNote].note;
            // Si no quedan ni nota ni resaltado, eliminar la entrada completa
            if (!allData[currentVerseForNote].highlighted) {
                delete allData[currentVerseForNote];
            }
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    // Vuelve a buscar el pasaje para actualizar la visualización
    buscarVersiculo(); 
    setStatus('Nota guardada.');
}

// Elimina la nota de localStorage
function deleteNote() {
    if (!currentVerseForNote) return;

    const allData = getAllVerseData();
    if (allData[currentVerseForNote]) {
        delete allData[currentVerseForNote].note;
        // Si no quedan ni nota ni resaltado, eliminar la entrada completa
        if (!allData[currentVerseForNote].highlighted) {
            delete allData[currentVerseForNote];
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    buscarVersiculo();
    setStatus('Nota eliminada.');
}

// Alterna el estado de resaltado de un versículo
function toggleHighlight(book, chapter, verse) {
    const verseId = `${book}_${chapter}_${verse}`;
    const allData = getAllVerseData();

    if (!allData[verseId]) {
        allData[verseId] = { highlighted: true }; // Crea y resalta si no existe
    } else {
        allData[verseId].highlighted = !allData[verseId].highlighted; // Invierte el estado
        // Si el resaltado se desactiva y no hay nota, eliminar la entrada completa
        if (!allData[verseId].highlighted && !allData[verseId].note) {
            delete allData[verseId];
        }
    }
    saveAllVerseData(allData);
    buscarVersiculo(); // Vuelve a buscar para actualizar la visualización
    setStatus(allData[verseId] && allData[verseId].highlighted ? 'Versículo resaltado.' : 'Resaltado quitado.');
}


// Añadir Event Listeners a los botones de acción (Nota/Resaltar) dinámicamente
function addActionButtonListeners() {
    document.querySelectorAll('.action-button').forEach(button => {
        button.onclick = null; // Eliminar listeners previos para evitar duplicados
        button.onclick = (event) => {
            const action = event.target.dataset.action;
            const book = event.target.dataset.book;
            const chapter = event.target.dataset.chapter;
            const verse = event.target.dataset.verse;

            if (action === 'note') {
                openNoteModal(book, chapter, verse);
            } else if (action === 'highlight') {
                toggleHighlight(book, chapter, verse);
            }
        };
    });
}

// Añadir Event Listeners a los botones de eliminar nota dinámicamente
function addDeleteNoteButtonListeners() {
    document.querySelectorAll('.note-delete-button').forEach(button => {
        button.onclick = null; // Eliminar listeners previos
        button.onclick = (event) => {
            currentVerseForNote = event.target.dataset.verseId; // Establecer el versículo actual para la eliminación
            deleteNote();
        };
    });
}

// --- Función para Compartir Pasaje ---

async function sharePassage() {
    const currentContent = resultadoArea.innerText.trim();

    if (!currentContent || currentContent === 'Cargando datos...') {
        setStatus('No hay contenido para compartir. Realice una búsqueda primero.');
        return;
    }

    let textToShare = currentContent;
    textToShare = textToShare.replace(/Referencia: /g, '');
    textToShare = textToShare.replace(/Total de capítulos: \d+/g, '');
    textToShare = textToShare.replace(/Total de versículos en el capítulo \d+: \d+/g, '');
    textToShare = textToShare.replace(/Error: .*?\./g, '').trim();
    textToShare = textToShare.replace(/No se encontraron coincidencias para su búsqueda./g, '').trim();
    
    // Quitar los textos de los botones de acción y sus emojis si se incluyeron accidentalmente en innerText
    textToShare = textToShare.replace(/✏️ Nota/g, '').replace(/✨ Resaltar/g, '');
    textToShare = textToShare.replace(/×/g, ''); // Eliminar el botón de eliminar nota

    const formattedText = `
✨📖 ${textToShare.trim()} 📖✨

---
Buscado con el Buscador Bíblico Neón
`;

    try {
        await navigator.clipboard.writeText(formattedText);
        setStatus('Versículo copiado al portapapeles con formato neón (texto plano).');
    } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
        setStatus('Error al copiar el versículo. Por favor, copie manualmente.');
    }
}


// --- Event Listeners (Activadores de las funciones) ---

buscarBtn.addEventListener('click', buscarVersiculo);
libroCombo.addEventListener('change', updateCapitulosInfo);
capituloEntry.addEventListener('input', updateVersiculosInfo);

prevCapituloBtn.addEventListener('click', () => navigateCapitulo(-1));
nextCapituloBtn.addEventListener('click', () => navigateCapitulo(1));

searchTextBtn.addEventListener('click', buscarTexto);
searchTextEntry.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        buscarTexto();
    }
});

shareBtn.addEventListener('click', sharePassage);

// Event Listeners del Modal de Notas
closeModalBtn.addEventListener('click', closeNoteModal);
saveNoteBtn.addEventListener('click', saveNote);
deleteNoteBtn.addEventListener('click', deleteNote);
// Cerrar modal al hacer clic fuera
noteModalOverlay.addEventListener('click', (event) => {
    if (event.target === noteModalOverlay) {
        closeNoteModal();
    }
});

// --- Inicialización ---
// Cargar datos al iniciar la página
loadBibleData();

// NUEVO: Manejar parámetros de URL al cargar la página (para redirigir desde notas)
document.addEventListener('DOMContentLoaded', () => {
    loadBibleData().then(() => { // Asegurarse de que los datos estén cargados primero
        const urlParams = new URLSearchParams(window.location.search);
        const book = urlParams.get('book');
        const chapter = urlParams.get('chapter');
        const verse = urlParams.get('verse');

        if (book && chapter && verse) {
            // Establecer los valores en los campos de entrada
            libroCombo.value = decodeURIComponent(book);
            capituloEntry.value = chapter;
            versiculoEntry.value = verse;
            
            // Asegurarse de que el combo de libros esté actualizado y luego buscar
            if (LIBROS_BIBLIA.includes(libroCombo.value)) {
                updateCapitulosInfo(); // Esto actualizará info y displayBookInfo
                buscarVersiculo();
            } else {
                setStatus('El libro especificado en la URL no fue encontrado.');
            }
        }
    });
});