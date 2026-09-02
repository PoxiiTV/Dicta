// Conexión con el servidor
const socket = io();

// Elementos del DOM
const micBtn = document.getElementById('micBtn');
const micBtnText = document.getElementById('micBtnText');
const interimTextEl = document.getElementById('interimText');
const finalTextEl = document.getElementById('finalText');

// Desktop buttons
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const closeBtn = document.getElementById('closeBtn');

// Mobile buttons
const mobileCopyBtn = document.getElementById('mobileCopyBtn');
const mobileClearBtn = document.getElementById('mobileClearBtn');

const statusIndicator = document.getElementById('statusIndicator');
const statusText = statusIndicator.querySelector('span');
const errorBox = document.getElementById('errorBox');
const errorMsg = document.getElementById('errorMsg');

// Modo escritorio MINI
const isDesktop = new URLSearchParams(window.location.search).get('isDesktop') === '1';
if (isDesktop) {
    document.body.classList.add('desktop-mode');
}

// Estado
let isRecording = false;
let recognition = null;
let finalTranscript = '';

// Inicializar Web Speech API
function initSpeechRecognition() {
    // Comprobar compatibilidad
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        showError('Tu navegador no soporta el reconocimiento de voz. Usa Chrome o Safari.');
        micBtn.disabled = true;
        return false;
    }

    recognition = new window.SpeechRecognition();
    recognition.continuous = true; // Para que no se pare cuando hacemos pausas
    recognition.interimResults = true; // Para mostrar resultados parciales
    recognition.lang = 'es-ES'; // Idioma por defecto (español)

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        micBtnText.innerText = 'Escuchando...';
        finalTextEl.innerText = finalTranscript;
        socket.emit('recording_status', true);
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                newFinal += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (newFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + newFinal;
            finalTextEl.innerText = finalTranscript;
            
            // Enviar la transcripción final al servidor
            socket.emit('transcription', { 
                type: 'final', 
                text: finalTranscript 
            });
        }

        interimTextEl.innerText = interimTranscript;
        
        // Enviar la transcripción parcial
        if (interimTranscript) {
            socket.emit('transcription', { 
                type: 'interim', 
                text: interimTranscript,
                fullText: finalTranscript
            });
        }
    };

    recognition.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error, event);
        if (event.error === 'not-allowed') {
            showError('Acceso al micrófono denegado. Safari puede bloquearlo si no confía plenamente en el certificado HTTPS local.');
        } else if (event.error === 'network') {
            showError('Error de red al intentar usar el reconocimiento. Común en Safari con IPs locales.');
        } else {
            showError('Error en el micro: ' + event.error);
        }
        stopRecording();
    };

    recognition.onend = () => {
        // Si sigue activo el botón (fue un corte accidental), reiniciar
        if (isRecording) {
            try {
                recognition.start();
            } catch (e) {
                stopRecording();
            }
        }
    };

    return true;
}

async function startRecording() {
    if (!recognition) {
        if (!initSpeechRecognition()) return;
    }
    
    try {
        // PARCHE PARA SAFARI iOS: Pedir permiso de micro explícitamente primero
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Detener las pistas inmediatamente, solo queríamos el permiso
                stream.getTracks().forEach(track => track.stop());
            } catch (mediaErr) {
                console.warn('getUserMedia falló (posible por certificado autofirmado en iOS):', mediaErr);
                showError('iOS ha bloqueado el micrófono. A veces ocurre por usar una red local (IP). Intenta usar Chrome.');
                return;
            }
        }

        finalTranscript = '';
        finalTextEl.innerText = '';
        interimTextEl.innerText = '';
        recognition.start();
        hideError();
    } catch (error) {
        console.error(error);
        showError('No se pudo iniciar el micrófono: ' + error.message);
    }
}

function stopRecording() {
    if (recognition && isRecording) {
        isRecording = false;
        recognition.stop();
        micBtn.classList.remove('recording');
        micBtnText.innerText = 'Empezar a Escuchar';
        interimTextEl.innerText = '';
        socket.emit('recording_status', false);
    }
}

// Botón de Micrófono
micBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

// Botón de Limpiar
function clearText() {
    finalTranscript = '';
    finalTextEl.innerText = 'Aquí aparecerá la transcripción en tiempo real...';
    interimTextEl.innerText = '';
    socket.emit('clear_text');
}
clearBtn.addEventListener('click', clearText);
mobileClearBtn.addEventListener('click', clearText);

// Botón de Copiar
async function copyText(btnElement) {
    const textToCopy = finalTextEl.innerText;
    if (!textToCopy || textToCopy === 'Aquí aparecerá la transcripción en tiempo real...') return;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
        btnElement.style.color = 'var(--success)';
        
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
            btnElement.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Error al copiar: ', err);
        showError('No se pudo copiar el texto.');
    }
}
copyBtn.addEventListener('click', () => copyText(copyBtn));
mobileCopyBtn.addEventListener('click', () => copyText(mobileCopyBtn));

// Botón Cerrar (Solo en desktop)
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('close-window');
    });
}

// Funciones de utilidad
function showError(msg) {
    errorMsg.innerText = msg;
    errorBox.classList.remove('hidden');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    errorBox.classList.add('hidden');
}

// Eventos de Socket.IO
socket.on('connect', () => {
    statusIndicator.classList.remove('disconnected');
    statusText.innerText = 'Conectado al servidor';
});

socket.on('disconnect', () => {
    statusIndicator.classList.add('disconnected');
    statusText.innerText = 'Desconectado del servidor';
    if (isRecording) stopRecording();
});

// Recibir orden de limpiar texto
socket.on('clear_text', () => {
    finalTranscript = '';
    finalTextEl.innerText = 'Aquí aparecerá la transcripción en tiempo real...';
    interimTextEl.innerText = '';
});

// Recibir transcripciones (para el PC)
let autoCopyTimer = null;
const autoCopySwitch = document.getElementById('autoCopySwitch');

socket.on('transcription_update', (data) => {
    if (data.type === 'final') {
        finalTranscript = data.text;
        finalTextEl.innerText = finalTranscript;
        interimTextEl.innerText = '';
    } else if (data.type === 'interim') {
        finalTextEl.innerText = data.fullText;
        interimTextEl.innerText = data.text;
    }

    // Lógica de Autocopiar
    if (isDesktop && autoCopySwitch && autoCopySwitch.checked) {
        clearTimeout(autoCopyTimer);
        autoCopyTimer = setTimeout(() => {
            if (finalTextEl.innerText && finalTextEl.innerText !== 'Aquí aparecerá la transcripción en tiempo real...') {
                copyText(copyBtn);
            }
        }, 1000);
    }
});

// Recibir estado de grabación
socket.on('recording_status_update', (remoteIsRecording) => {
    if (remoteIsRecording) {
        micBtn.classList.add('recording');
        micBtnText.innerText = 'Escuchando desde otro...';
        micBtn.disabled = true;
    } else {
        micBtn.classList.remove('recording');
        micBtnText.innerText = 'Empezar a Escuchar';
        micBtn.disabled = false;
        interimTextEl.innerText = '';
    }
});

// Recibir IP del servidor
const mobileUrlDisplay = document.getElementById('mobileUrlDisplay');
const mobileUrlSpan = mobileUrlDisplay ? mobileUrlDisplay.querySelector('span') : null;

socket.on('server_info', (info) => {
    if (isDesktop && mobileUrlDisplay && mobileUrlSpan) {
        // Encontrar una IP preferible, normalmente la que no empiece por 127 o VirtualBox (172)
        let bestIp = info.ips[0];
        const normalIp = info.ips.find(ip => ip.startsWith('192.168.1.'));
        if (normalIp) bestIp = normalIp;

        const url = `https://${bestIp}:${info.port}`;
        mobileUrlSpan.innerText = url;
        mobileUrlDisplay.classList.remove('hidden');

        // Permitir copiar la URL al hacer clic
        mobileUrlDisplay.onclick = async () => {
            try {
                await navigator.clipboard.writeText(url);
                const originalHtml = mobileUrlDisplay.innerHTML;
                mobileUrlDisplay.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copiado!</span>';
                setTimeout(() => {
                    mobileUrlDisplay.innerHTML = originalHtml;
                }, 2000);
            } catch(e) {}
        };
    }
});
