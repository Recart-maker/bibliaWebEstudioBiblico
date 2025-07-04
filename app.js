const JSON_FILE_NAME = 'libros_biblia.json';
const INFO_FILE_NAME = 'resumen_libros.json';
let LIBROS_BIBLIA = [];
let BIBLIA_DATA = {}; // Contendrá los datos de la Biblia cargados
let INFO_LIBROS = {}; // Contendrá la información resumida de los libros

// --- Referencias a los elementos del DOM ---
// Asegúrate de que estos IDs existan en tu index.html
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

const searchTextEntry = document.getElementById('search-text-entry'); // Corregido: ID en HTML es 'search-text-entry'
const searchTextBtn = document.getElementById('search-text-btn');

const shareBtn = document.getElementById('share-btn');

// Elementos del Modal de Notas
const noteModalOverlay = document.getElementById('note-modal-overlay');
const closeModalBtn = document.querySelector('.close-button');
const modalVerseRef = document.getElementById('modal-verse-ref');
const noteTextArea = document.getElementById('note-text-area');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');

// Elementos del Versículo del Día (asegúrate de que existan en tu HTML)
const verseOfTheDayText = document.getElementById('verse-of-the-day-text');
const verseOfTheDayReference = document.getElementById('verse-of-the-day-reference');

// NUEVOS Elementos para Versículo Aleatorio (asegúrate de que existan en tu HTML)
const randomVerseBtn = document.getElementById('random-verse-btn');
const randomVerseOutputArea = document.getElementById('random-verse-output-area');

// NUEVO: Referencia al botón "Mis Notas y Resaltados"
const myNotesBtn = document.getElementById('my-notes-btn');


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

// --- Funciones para el Versículo del Día ---

function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

async function displayVerseOfTheDay() {
    // Si los datos de la Biblia no están cargados, salimos o mostramos un mensaje de carga
    if (Object.keys(BIBLIA_DATA).length === 0) {
        if (verseOfTheDayText) verseOfTheDayText.textContent = "Cargando versículo...";
        if (verseOfTheDayReference) verseOfTheDayReference.textContent = "";
        return;
    }

    const todayDate = getTodayDateString();
    let storedVerseData = JSON.parse(localStorage.getItem('verseOfTheDay')) || {};

    let verseToDisplay = null;
    let verseRef = null;
    let verseDetails = null; // Para almacenar libro, capítulo, versículo para el clic

    if (storedVerseData.date === todayDate && storedVerseData.verse) {
        // Si ya tenemos un versículo guardado para hoy, lo usamos
        verseToDisplay = storedVerseData.verse.text;
        verseRef = storedVerseData.verse.reference;
        verseDetails = storedVerseData.verse; // Usar los detalles guardados
    } else {
        // Si no, generamos uno nuevo
        const allBooks = Object.keys(BIBLIA_DATA); // Usar BIBLIA_DATA aquí
        let randomBookName, randomChapterNum, randomVerseNum;
        let foundVerse = false;
        let attempts = 0;
        const maxAttempts = 100; // Para evitar bucles infinitos si los datos son extraños

        while (!foundVerse && attempts < maxAttempts) {
            attempts++;
            randomBookName = allBooks[Math.floor(Math.random() * allBooks.length)];
            const bookData = BIBLIA_DATA[randomBookName]; // Usar BIBLIA_DATA
            
            // Verifica que bookData exista y tenga capítulos
            if (!bookData || Object.keys(bookData).length === 0) {
                continue; 
            }

            const chapterKeys = Object.keys(bookData).map(Number).sort((a,b)=>a-b);
            if (chapterKeys.length === 0) {
                continue;
            }

            randomChapterNum = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
            const chapterVerses = bookData[String(randomChapterNum)]; // Versículos de ese capítulo
            
            if (!chapterVerses || Object.keys(chapterVerses).length === 0) { // Verifica si el capítulo tiene versículos
                continue;
            }

            const verseKeys = Object.keys(chapterVerses).map(Number).sort((a,b)=>a-b);
            if (verseKeys.length === 0) {
                continue;
            }
            randomVerseNum = verseKeys[Math.floor(Math.random() * verseKeys.length)];

            // Asegurarse de que el versículo realmente existe
            if (chapterVerses[String(randomVerseNum)]) {
                verseToDisplay = chapterVerses[String(randomVerseNum)];
                verseRef = `${randomBookName} ${randomChapterNum}:${randomVerseNum}`;
                verseDetails = { // Guardar los detalles para uso futuro
                    text: verseToDisplay,
                    reference: verseRef,
                    book: randomBookName,
                    chapter: randomChapterNum,
                    verse: randomVerseNum
                };
                foundVerse = true;
            }
        }

        if (foundVerse) {
            // Guardar el nuevo versículo para hoy
            storedVerseData = {
                date: todayDate,
                verse: verseDetails // Guardamos los detalles completos
            };
            localStorage.setItem('verseOfTheDay', JSON.stringify(storedVerseData));
        } else {
            // Fallback si no se encontró un versículo después de muchos intentos
            verseToDisplay = "No se pudo cargar el versículo del día. Intenta de nuevo más tarde.";
            verseRef = "";
            verseDetails = null;
            console.error("No se pudo encontrar un versículo aleatorio después de muchos intentos. Revisa la estructura de libros_biblia.json");
        }
    }
    
    // Asegurarse de que los elementos existan antes de manipularlos
    if (verseOfTheDayText) {
        verseOfTheDayText.textContent = `"${verseToDisplay}"`;
    } else {
        console.warn("Elemento 'verse-of-the-day-text' no encontrado.");
    }

    if (verseOfTheDayReference) {
        verseOfTheDayReference.textContent = `- ${verseRef}`;
        // Hacer clic en la referencia del versículo del día para ir a él
        verseOfTheDayReference.onclick = () => {
            if (verseDetails) { // Usar verseDetails
                const { book, chapter, verse } = verseDetails;
                if (libroCombo && capituloEntry && versiculoEntry) {
                    libroCombo.value = book;
                    capituloEntry.value = chapter;
                    versiculoEntry.value = verse;
                    updateCapitulosInfo(); // Asegura que la info del libro se actualice
                    buscarVersiculo();
                    // Opcional: Desplazarse a la sección de resultados
                    const resultadoSection = document.getElementById('resultado-area');
                    if (resultadoSection) {
                        resultadoSection.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    console.warn("Elementos de entrada (libro, capítulo, versículo) no encontrados para el clic del versículo del día.");
                }
            }
        };
    } else {
        console.warn("Elemento 'verse-of-the-day-reference' no encontrado.");
    }
}

// --- NUEVA Función para un Versículo Aleatorio (al hacer clic en un botón) ---
async function displayRandomVerse() {
    if (Object.keys(BIBLIA_DATA).length === 0) {
        if (randomVerseOutputArea) {
            randomVerseOutputArea.innerHTML = '<p class="error-text">Datos de la Biblia no cargados. Inténtalo de nuevo más tarde.</p>';
        }
        setStatus("Error: Datos de la Biblia no disponibles para versículo aleatorio.");
        return;
    }

    if (randomVerseOutputArea) {
        randomVerseOutputArea.innerHTML = '<p style="color: #00FFCC; text-align: center;">Buscando un versículo aleatorio...</p>';
    }

    try {
        const allBooks = Object.keys(BIBLIA_DATA);
        if (allBooks.length === 0) {
            throw new Error("No hay libros disponibles en los datos de la Biblia.");
        }
        const randomBookName = allBooks[Math.floor(Math.random() * allBooks.length)];
        const bookData = BIBLIA_DATA[randomBookName];

        if (!bookData || Object.keys(bookData).length === 0) {
            throw new Error(`Libro ${randomBookName} no tiene capítulos válidos.`);
        }
        const chapterKeys = Object.keys(bookData).map(Number).sort((a,b)=>a-b);
        if (chapterKeys.length === 0) {
            throw new Error(`Libro ${randomBookName} no tiene capítulos válidos.`);
        }

        const randomChapterNum = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
        const chapterVerses = bookData[String(randomChapterNum)];

        if (!chapterVerses || Object.keys(chapterVerses).length === 0) {
            throw new Error(`Capítulo ${randomChapterNum} de ${randomBookName} no tiene versículos válidos.`);
        }
        const verseKeys = Object.keys(chapterVerses).map(Number).sort((a,b)=>a-b);
        if (verseKeys.length === 0) {
            throw new Error(`Capítulo ${randomChapterNum} de ${randomBookName} no tiene versículos válidos.`);
        }

        const randomVerseNum = verseKeys[Math.floor(Math.random() * verseKeys.length)];
        const verseText = chapterVerses[String(randomVerseNum)];

        const reference = `${randomBookName} ${randomChapterNum}:${randomVerseNum}`;

        if (randomVerseOutputArea) {
            randomVerseOutputArea.innerHTML = `
                <div class="verse-entry">
                    <span class="verse-reference">${reference}</span>
                    <span class="verse-text">"${verseText}"</span>
                </div>
            `;
        }
        setStatus(`Versículo aleatorio cargado: ${reference}`);

    } catch (error) {
        console.error("Error al obtener versículo aleatorio:", error);
        if (randomVerseOutputArea) {
            randomVerseOutputArea.innerHTML = '<p class="error-text">No se pudo cargar el versículo aleatorio. Inténtalo de nuevo.</p>';
        }
        setStatus("Error al cargar versículo aleatorio.");
    }
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
    
    // Si el capítulo actual no es un número válido, intenta establecerlo al primero del libro.
    if (isNaN(currentCapitulo)) {
        const libroData = BIBLIA_DATA[libroCombo.value];
        if (libroData) {
            const capitulosDelLibro = Object.keys(libroData).map(Number).sort((a,b)=>a-b);
            if (capitulosDelLibro.length > 0) {
                currentCapitulo = capitulosDelLibro[0];
                capituloEntry.value = currentCapitulo;
            } else {
                setStatus('El libro seleccionado no tiene capítulos.');
                return;
            }
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
            versiculoEntry.value = '1'; // Al navegar capítulo, ir al versículo 1
            buscarVersiculo();
        } else {
            // Intentar ir al siguiente/anterior libro
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

                if (direction === 1) { // Si avanzamos, ir al primer capítulo del nuevo libro
                    capituloEntry.value = capitulosDelLibro[0];
                } else { // Si retrocedemos, ir al último capítulo del nuevo libro
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
        // Escapar caracteres especiales para usar en RegExp
        const pattern = includeTerms.map(term => exactPhrase ? term : `\\b${term}\\b`).join('|');
        includeRegex = new RegExp(pattern, 'gi');
    }

    let exactPhraseRegex = null;
    if (exactPhrase) {
        // Escapar caracteres especiales para la frase exacta
        exactPhraseRegex = new RegExp(exactPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
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
                            // Verifica que TODAS las palabras a incluir estén presentes (para la lógica AND)
                            for (const term of includeTerms) {
                                if (!lowerCaseVerse.includes(term)) { // Simple 'contains' check
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
                            // Resaltar la frase exacta primero para evitar que sea sobrescrita
                            if (exactPhraseRegex) {
                                highlightedText = highlightedText.replace(exactPhraseRegex, (match) => `<span class="highlight">${match}</span>`);
                            }
                            // Luego resaltar los términos individuales, asegurándose de no re-resaltar lo ya resaltado
                            if (includeRegex) {
                                highlightedText = highlightedText.replace(includeRegex, (match) => {
                                    // Evitar re-resaltar si ya es parte de un highlight
                                    if (match.includes('<span class="highlight">') || highlightedText.includes(`<span class="highlight">${match}</span>`)) {
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
        resultadoArea.scrollTop = 0; // Volver al inicio de los resultados
    }
    addActionButtonListeners(); // Añadir listeners a los nuevos botones
    addDeleteNoteButtonListeners(); // Añadir listeners para borrar notas
}


// --- Cargar datos desde los archivos JSON ---

async function loadBibleData() {
    try {
        const responseBiblia = await fetch(JSON_FILE_NAME);
        if (!responseBiblia.ok) {
            throw new Error(`No se encontró el archivo '${JSON_FILE_NAME}'. Asegúrate de que esté en el mismo directorio o la ruta sea correcta.`);
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
        
        // Llenar el select de libros
        if (libroCombo) { // Asegurarse de que el elemento exista antes de manipularlo
            libroCombo.innerHTML = ''; 
            LIBROS_BIBLIA.forEach(libro => {
                const option = document.createElement('option');
                option.value = libro;
                option.textContent = libro;
                libroCombo.appendChild(option);
            });

            if (LIBROS_BIBLIA.length > 0) {
                libroCombo.value = LIBROS_BIBLIA[0]; // Seleccionar el primer libro por defecto
                updateCapitulosInfo();
                displayBookInfo();
            }
        } else {
            console.error("Elemento 'libro-combo' no encontrado en el DOM.");
        }
        
        setStatus('Datos de la Biblia cargados exitosamente. Seleccione un pasaje y presione Buscar.');

        // Llamar a displayVerseOfTheDay después de cargar los datos
        displayVerseOfTheDay();

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
        allData[currentVerseForNote] = {
            ...allData[currentVerseForNote], // Mantener highlighted si ya existe
            note: noteText,
            reference: modalVerseRef.textContent.replace('Nota para: ', '') // Guardar la referencia completa
        };
    } else {
        // Si la nota está vacía, la eliminamos
        if (allData[currentVerseForNote] && allData[currentVerseForNote].highlighted) {
            // Si solo se elimina la nota pero está resaltado, quitar la nota y mantener el resaltado
            delete allData[currentVerseForNote].note;
        } else {
            // Si no hay nota y no está resaltado, eliminar completamente la entrada
            delete allData[currentVerseForNote];
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    // Vuelve a cargar el pasaje actual para que la nota se muestre o se oculte
    buscarVersiculo(); 
    // O si estás en una búsqueda de texto:
    // buscarTexto(); // Esto dependerá de la última búsqueda realizada
}

// Elimina la nota de localStorage
function deleteNote() {
    if (!currentVerseForNote) return;

    const allData = getAllVerseData();
    if (allData[currentVerseForNote]) {
        if (allData[currentVerseForNote].highlighted) {
            // Si hay resaltado, solo elimina la nota
            delete allData[currentVerseForNote].note;
        } else {
            // Si no hay resaltado, elimina toda la entrada
            delete allData[currentVerseForNote];
        }
    }
    saveAllVerseData(allData);
    closeNoteModal();
    buscarVersiculo(); // Vuelve a cargar el pasaje
    // buscarTexto(); // O si estás en una búsqueda de texto
}

// Maneja el resaltado de un versículo
function toggleHighlight(book, chapter, verse) {
    const verseId = `${book}_${chapter}_${verse}`;
    const allData = getAllVerseData();

    if (allData[verseId] && allData[verseId].highlighted) {
        // Si ya está resaltado, lo desresaltamos
        if (allData[verseId].note) {
            // Si también tiene nota, solo quitamos el resaltado
            delete allData[verseId].highlighted;
        } else {
            // Si no tiene nota, eliminamos la entrada completa
            delete allData[verseId];
        }
    } else {
        // Si no está resaltado, lo resaltamos
        allData[verseId] = {
            ...allData[verseId],
            highlighted: true,
            reference: `${book} ${chapter}:${verse}` // Aseguramos que la referencia se guarde
        };
    }
    saveAllVerseData(allData);
    buscarVersiculo(); // Vuelve a cargar el pasaje
    // buscarTexto(); // O si estás en una búsqueda de texto
}

// Añade listeners a los botones de acción (nota y resaltar) después de cada renderizado
function addActionButtonListeners() {
    document.querySelectorAll('.action-button').forEach(button => {
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

// Añade listeners a los botones de eliminar nota
function addDeleteNoteButtonListeners() {
    document.querySelectorAll('.note-delete-button').forEach(button => {
        button.onclick = (event) => {
            const verseId = event.target.dataset.verseId;
            // Configura currentVerseForNote para que deleteNote sepa qué borrar
            currentVerseForNote = verseId; 
            deleteNote();
        };
    });
}


// --- Función para Compartir Versículo (por implementar) ---
function shareVerse() {
    setStatus('Función de compartir aún no implementada.');
    alert('Esta función de compartir está en desarrollo. ¡Pronto podrás compartir versículos!');
}


// --- Event Listeners y Carga Inicial ---
document.addEventListener('DOMContentLoaded', () => {
    loadBibleData(); // Carga inicial de datos

    if (libroCombo) {
        libroCombo.addEventListener('change', updateCapitulosInfo);
    }
    if (capituloEntry) {
        capituloEntry.addEventListener('input', updateVersiculosInfo);
    }
    if (buscarBtn) {
        buscarBtn.addEventListener('click', buscarVersiculo);
    }
    if (prevCapituloBtn) {
        prevCapituloBtn.addEventListener('click', () => navigateCapitulo(-1));
    }
    if (nextCapituloBtn) {
        nextCapituloBtn.addEventListener('click', () => navigateCapitulo(1));
    }
    if (searchTextBtn) {
        searchTextBtn.addEventListener('click', buscarTexto);
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', shareVerse); 
    }
    if (randomVerseBtn) {
        randomVerseBtn.addEventListener('click', displayRandomVerse);
    }
    
    // Listeners para el modal de notas
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeNoteModal);
    }
    if (noteModalOverlay) {
        noteModalOverlay.addEventListener('click', (event) => {
            if (event.target === noteModalOverlay) { 
                closeNoteModal();
            }
        });
    }
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNote);
    }
    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', deleteNote);
    }

    // *** NUEVO: Event Listener para el botón "Mis Notas y Resaltados" ***
    if (myNotesBtn) {
        myNotesBtn.addEventListener('click', () => {
            window.location.href = 'biblioteca_notas.html'; 
        });
    }
});