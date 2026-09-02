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
    const langSelect = document.getElementById('langSelect');
    recognition.lang = langSelect ? langSelect.value : 'es-ES';

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
    statusText.innerText = 'Conectado';
});

socket.on('disconnect', () => {
    statusIndicator.classList.add('disconnected');
    statusText.innerText = 'Desconectado';
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
        if (isDesktop && window.saveToHistory) window.saveToHistory(finalTranscript);
    } else if (data.type === 'interim') {
        finalTextEl.innerText = data.fullText;
        interimTextEl.innerText = data.text;
    }

    // Lógica de Autocopiar
    const autoCopySwitchDesktop = document.getElementById('autoCopySwitch');
    if (isDesktop && autoCopySwitchDesktop && autoCopySwitchDesktop.checked) {
        clearTimeout(autoCopyTimer);
        autoCopyTimer = setTimeout(async () => {
            if (finalTextEl.innerText && finalTextEl.innerText !== 'Aquí aparecerá la transcripción en tiempo real...') {
                await copyText(copyBtn);
                if (window.doAutoPaste) window.doAutoPaste();
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

// === DICTA 2.0 FEATURES ===

if (isDesktop) {
    const settingsBtn = document.getElementById('settingsBtn');
    const historyBtn = document.getElementById('historyBtn');
    const settingsModal = document.getElementById('settingsModal');
    const historyModal = document.getElementById('historyModal');
    const showQrBtn = document.getElementById('showQrBtn');
    const qrContainer = document.getElementById('qrContainer');
    const historyList = document.getElementById('historyList');
    const autoPasteSwitch = document.getElementById('autoPasteSwitch');
    const autoCopySwitchDesktop = document.getElementById('autoCopySwitch');

    // Modal Logic
    const closeModals = () => {
        const wasHidden = settingsModal.classList.contains('hidden') && historyModal.classList.contains('hidden');
        settingsModal.classList.add('hidden');
        historyModal.classList.add('hidden');
        if (!wasHidden) {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('resize-window', { width: 320, height: 250 });
        }
    };

    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModals));

    settingsBtn.addEventListener('click', () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('resize-window', { width: 420, height: 580 });
        settingsModal.classList.remove('hidden');
    });

    historyBtn.addEventListener('click', () => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('resize-window', { width: 400, height: 450 });
        historyModal.classList.remove('hidden');
        renderHistory();
    });

    // Settings logic (LocalStorage)
    const loadSettings = () => {
        const paste = localStorage.getItem('autoPaste');
        if (paste === 'true') autoPasteSwitch.checked = true;
        const copy = localStorage.getItem('autoCopy');
        if (copy === 'false') autoCopySwitchDesktop.checked = false;
    };
    
    autoPasteSwitch.addEventListener('change', (e) => localStorage.setItem('autoPaste', e.target.checked));
    autoCopySwitchDesktop.addEventListener('change', (e) => localStorage.setItem('autoCopy', e.target.checked));
    loadSettings();

    // QR Code Logic
    let qrcodeGenerated = false;
    showQrBtn.addEventListener('click', () => {
        if (!qrcodeGenerated && mobileUrlSpan && mobileUrlSpan.innerText) {
            const QRCode = require('qrcode');
            const canvas = document.getElementById('qrcode');
            QRCode.toCanvas(canvas, mobileUrlSpan.innerText, { width: 200, margin: 1 }, function (error) {
                if (error) console.error(error);
                qrcodeGenerated = true;
                qrContainer.classList.remove('hidden');
                showQrBtn.style.display = 'none';
            });
        }
    });

    // History Logic
    window.saveToHistory = (text) => {
        if (!text || text.trim() === '' || text === 'Aquí aparecerá la transcripción en tiempo real...') return;
        let history = JSON.parse(localStorage.getItem('dictaHistory') || '[]');
        if (history.length === 0 || history[0] !== text) {
            history.unshift(text);
            if (history.length > 10) history.pop();
            localStorage.setItem('dictaHistory', JSON.stringify(history));
        }
    };

    const renderHistory = () => {
        let history = JSON.parse(localStorage.getItem('dictaHistory') || '[]');
        if (history.length === 0) {
            historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No hay historial todavía.</p>';
            return;
        }
        historyList.innerHTML = history.map(t => `<div class="history-item">${t}</div>`).join('');
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                navigator.clipboard.writeText(item.innerText).then(() => {
                    item.style.borderColor = 'var(--success)';
                    setTimeout(() => item.style.borderColor = 'transparent', 1000);
                });
            });
        });
    };

    // Auto-paste intercept using Child Process
    const { exec } = require('child_process');
    window.doAutoPaste = function() {
        if (autoPasteSwitch.checked) {
            const script = `
                Add-Type -AssemblyName System.Windows.Forms
                [System.Windows.Forms.SendKeys]::SendWait('^v')
            `;
            exec(`powershell -Command "${script}"`);
        }
    };
}
