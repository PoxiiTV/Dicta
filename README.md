<div align="center">
  <img src="icon.png" alt="Dicta Logo" width="120" style="margin-bottom: 20px;" />
  
  <h1>🎙️ Dicta 2.0</h1>
  
  <p>
    <b>Transcribe tu voz en el móvil y escríbela mágicamente en tu PC local.</b>
  </p>

  <p>
    <a href="#-características">Características</a> •
    <a href="#-uso-rápido">Cómo usar</a> •
    <a href="#️-tecnologías-utilizadas">Tecnologías</a>
  </p>
  
  <img src="foto-dicta.png" alt="Interfaz de Dicta" width="550" style="border-radius: 12px; margin-top: 20px;" />
</div>

<br/>

> **Dicta 2.0** es una aplicación dual (Web y Escritorio) que te permite utilizar el micrófono de tu teléfono móvil para dictar texto y verlo aparecer al instante en tu ordenador, ¡o incluso que se escriba de forma automática en tu documento Word/Notepad!

---

## ✨ Características de la versión 2.0

- ⚡ **Tiempo Real**: Sincronización instantánea entre tu móvil y tu PC gracias a Socket.io.
- 🤖 **Autocopiado Inteligente**: La aplicación detecta cuándo dejas de hablar (1 segundo de silencio) y copia automáticamente el texto a tu portapapeles sin perder el foco de tus otras aplicaciones (vía IPC nativo).
- ⌨️ **Escritura Directa (Auto-pegar)**: ¿Quieres que se escriba solo? Actívalo, y Dicta simulará `Ctrl+V` (usando automatización nativa VBScript) para soltar la transcripción en tu Word o Bloc de notas, ¡y se limpiará para la siguiente frase!
- 📷 **Emparejamiento QR Mágico**: Olvídate de teclear IPs. Se genera un código QR automático en los Ajustes; solo tienes que apuntar con la cámara de tu móvil para conectarte.
- 🌍 **Soporte Multi-idioma**: Reconoce español, inglés, francés y alemán. ¡Solo elige tu idioma y habla!
- 🕰️ **Historial de Transcripciones**: Guarda tus últimos 10 dictados para que nunca pierdas información importante, incluso si se limpia la pantalla.
- 💻 **Widget Flotante (PC)**: El cliente de Windows funciona como un pequeño widget transparente y arrastrable "siempre por encima" con diseño *Glassmorphism* oscuro.
- 🔒 **Certificados SSL Automáticos**: Generación de HTTPS al vuelo para que iOS y Android te permitan usar el micrófono de forma segura.

---

## 🚀 Uso Rápido

### 💻 En tu PC (Windows)
Descarga la aplicación portable (el archivo `.exe`) de la pestaña Releases, ¡no necesita instalación! Se abrirá un pequeño widget transparente.

### 📱 En tu Móvil
1. Asegúrate de estar en la misma red Wi-Fi que el ordenador.
2. Abre los **Ajustes** en el PC (el icono del engranaje).
3. Apunta con la cámara de tu móvil al **Código QR** que aparece.
4. *(Nota: Te saldrá un aviso de que la conexión no es privada. Haz clic en Avanzado -> Continuar).*
5. Elige tu idioma, dale al botón de **Empezar a Escuchar** y permite el acceso al micrófono.
6. ¡Empieza a hablar y verás el texto escribiéndose en tu PC!

---

## 🧠 ¿Cómo funciona la transcripción?

¡La magia ocurre sin instalar pesadas inteligencias artificiales en tu PC! 

Dicta aprovecha la **Web Speech API** integrada de forma nativa en los navegadores modernos (como Safari, Chrome o Edge). Cuando hablas por tu móvil:
1. **Reconocimiento Nativo**: El navegador de tu teléfono procesa el audio utilizando los motores de reconocimiento de voz de Apple o Google (altamente precisos y rápidos).
2. **Eventos en Vivo**: A medida que hablas, el navegador nos va enviando el texto parcial (interim) y final.
3. **Sincronización Ultrarrápida**: Capturamos ese texto con JavaScript y lo enviamos a través de **WebSockets** (`Socket.io`) a tu servidor local.
4. **Pantalla del PC**: El widget de Windows recibe el texto en milisegundos y te lo muestra en pantalla, listo para copiar.

Todo el tráfico es local y seguro (gracias a los certificados HTTPS autogenerados), haciendo que la latencia sea prácticamente cero.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 Vanilla, JavaScript (Web Speech API).
- **Backend**: Node.js, Express, Socket.io.
- **Escritorio**: Electron.

<div align="center">
  <p>Creado con ❤️ para facilitar tu día a día.</p>
</div>
