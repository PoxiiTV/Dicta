<div align="center">
  <img src="icon.png" alt="Dicta Logo" width="120" style="margin-bottom: 20px;" />
  
  <h1>🎙️ Dicta</h1>
  
  <p>
    <b>Transcribe tu voz en el móvil y cópiala en tu PC en tiempo real.</b>
  </p>

  <p>
    <a href="#-características">Características</a> •
    <a href="#-uso-rápido">Cómo usar</a> •
    <a href="#️-tecnologías-utilizadas">Tecnologías</a>
  </p>
  
  <img src="foto-dicta.png" alt="Interfaz de Dicta" width="550" style="border-radius: 12px; margin-top: 20px;" />
</div>

<br/>

> **Dicta** es una aplicación dual (Web y Escritorio) que te permite utilizar el micrófono de tu teléfono móvil para dictar texto y verlo aparecer al instante en la pantalla de tu ordenador. Olvídate de mandarte mensajes a ti mismo para pasar texto. Simplemente abre Dicta en tu PC, conéctate desde tu móvil, ¡y empieza a hablar!

---

## ✨ Características

- ⚡ **Tiempo Real**: Sincronización instantánea entre tu móvil y tu PC gracias a Socket.io.
- 🤖 **Autocopiado Inteligente**: La aplicación detecta cuándo dejas de hablar (1 segundo de silencio) y copia automáticamente el texto a tu portapapeles sin que toques nada.
- 🌐 **Enlace Dinámico Directo**: Tu PC detectará su IP local y te la mostrará cómodamente en pantalla para que sepas qué URL exacta introducir en el móvil con un solo clic.
- 📱 **Interfaz Web Premium**: Un diseño *Glassmorphism* moderno y elegante en el navegador.
- 💻 **Widget Flotante (PC)**: El cliente de Windows funciona como un pequeño widget transparente y arrastrable "siempre por encima" que no molesta en tu pantalla.
- 🔒 **Certificados SSL Automáticos**: Generación de HTTPS al vuelo para que iOS y Android te permitan usar el micrófono de forma segura.

---

## 🚀 Uso Rápido

### 💻 En tu PC (Windows)
Descarga la aplicación portable o ejecuta el código fuente. Se abrirá un pequeño widget transparente.
- Si usas el código fuente: Ejecuta `npm start` (o `start.bat`).

### 📱 En tu Móvil
1. Asegúrate de estar en la misma red Wi-Fi que el ordenador.
2. Abre en tu móvil la **URL exacta** que aparece en la esquina inferior izquierda del widget de PC (ej. `https://192.168.1.33:3000`). ¡Puedes hacer clic en ella para copiarla!
3. *(Nota: Te saldrá un aviso de que la conexión no es privada. Haz clic en Avanzado -> Continuar).*
4. Dale al botón de **Empezar a Escuchar** y permite el acceso al micrófono.
5. ¡Empieza a hablar y verás el texto en tu PC copiándose mágicamente!

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 Vanilla, JavaScript (Web Speech API).
- **Backend**: Node.js, Express, Socket.io.
- **Escritorio**: Electron.

<div align="center">
  <p>Creado con ❤️ para facilitar tu día a día.</p>
</div>
