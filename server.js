const express = require('express');
const https = require('https');
const selfsigned = require('selfsigned');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();

// Generar certificado autofirmado al vuelo para HTTPS
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });

const httpsOptions = {
    key: pems.private,
    cert: pems.cert
};

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

const server = https.createServer(httpsOptions, app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado:', socket.id);

    // Cuando el móvil envía una transcripción
    socket.on('transcription', (data) => {
        // Retransmitir a todos los demás clientes conectados
        socket.broadcast.emit('transcription_update', data);
    });
    
    // Para enviar el estado de grabación (opcional)
    socket.on('recording_status', (isRecording) => {
        socket.broadcast.emit('recording_status_update', isRecording);
    });

    // Limpiar texto
    socket.on('clear_text', () => {
        socket.broadcast.emit('clear_text');
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Obtener IPs locales
function getLocalIPs() {
    const ips = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips.length > 0 ? ips : ['127.0.0.1'];
}

const PORT = 3000;
const IPs = getLocalIPs();

server.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log('🚀 SERVIDOR DE TRANSCRIPCIÓN INICIADO');
    console.log('==================================================');
    console.log(`🌐 En el PC abre:     https://localhost:${PORT}`);
    IPs.forEach(ip => {
        console.log(`📱 En el MÓVIL abre:  https://${ip}:${PORT}`);
    });
    console.log('==================================================');
    console.log('NOTA IMPORTANTE: Al entrar en el móvil, el navegador te dirá');
    console.log('que la conexión "no es privada". Esto es normal.');
    console.log('Toca en "Configuración avanzada" y luego en "Continuar".');
    console.log('==================================================');
});
