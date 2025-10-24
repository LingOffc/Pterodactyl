// =============================
// 📋 Fungsi: Salin Kode
// =============================
function copyCode(btn) {
  const code = btn.parentElement.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Disalin';
    setTimeout(() => (btn.innerHTML = originalText), 1500);
  });
}

// =============================
// 🧠 Fungsi: Set Prompt
// =============================
function setPrompt(text) {
  const input = document.getElementById('userInput');
  input.value = text;
  input.focus();
}

// =============================
// ✨ Fungsi: Buat Efek Partikel
// =============================
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particlesCount = 30;

  for (let i = 0; i < particlesCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 10 + 5;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = Math.random() * 10 + 10;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.1;

    particlesContainer.appendChild(particle);
  }
}

// =============================
// 🚀 Eksekusi Utama
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById("chatBox");
  const userInput = document.getElementById("userInput");
  const historyContainer = document.getElementById("history");
  const sidebar = document.getElementById("sidebar");
  const hamburger = document.getElementById("hamburger");
  const newChatBtn = document.getElementById("newChatBtn");
  const sendButton = document.getElementById("sendButton");
  const darkThemeBtn = document.getElementById("darkThemeBtn");
  const lightThemeBtn = document.getElementById("lightThemeBtn");
  const scrollBottomBtn = document.getElementById("scrollBottom");

  let currentChatId = `chat_${Date.now()}`;
  let chats = JSON.parse(localStorage.getItem('finixChats') || '[]');
  let currentMessages = [];

  createParticles();

  // =============================
  // ⚙️ Inisialisasi
  // =============================
  function init() {
    renderChatHistory();
    if (chats.length === 0) createNewChat();
    else {
      currentChatId = chats[0].id;
      currentMessages = [...chats[0].messages];
      renderChat();
    }
    bindEvents();
    highlightCodeBlocks();
    setupSmoothScrolling();
  }

  // =============================
  // 🖱️ Event Listener
  // =============================
  function bindEvents() {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth < 768 && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
      }
    });

    userInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = `${this.scrollHeight}px`;
    });

    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendButton.addEventListener('click', sendMessage);

    newChatBtn.addEventListener('click', () => {
      createNewChat();
      if (window.innerWidth < 768) {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
      }
    });

    chatBox.addEventListener('click', (e) => {
      if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
        copyCode(e.target.closest('.copy-btn'));
      }
    });

    darkThemeBtn.addEventListener('click', () => {
      document.body.classList.remove('light-theme');
      darkThemeBtn.classList.add('active');
      lightThemeBtn.classList.remove('active');
    });

    lightThemeBtn.addEventListener('click', () => {
      document.body.classList.add('light-theme');
      lightThemeBtn.classList.add('active');
      darkThemeBtn.classList.remove('active');
    });
  }

  // =============================
  // ⬇️ Scroll Otomatis
  // =============================
  function setupSmoothScrolling() {
    chatBox.addEventListener('scroll', () => {
      const threshold = 100;
      const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
      scrollBottomBtn.classList.toggle('visible', !isNearBottom);
    });

    scrollBottomBtn.addEventListener('click', () => {
      chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    });

    const observer = new MutationObserver(() => {
      chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    });

    observer.observe(chatBox, { childList: true, subtree: true });
  }

  // =============================
  // 💬 Kirim Pesan
  // =============================
  async function fetchAIResponse(message, userId = "guest") {
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://luminai.my.id/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          user: userId,
          prompt: "Kamu adalah Finix-AI, asisten AI yang ramah dan pintar. Berikan jawaban yang jelas, sopan, dan profesional."
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      return data.result || "Maaf, saya tidak mengerti. Bisa diulangi?";
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.name === 'AbortError') return "Permintaan waktu habis. Silakan coba lagi.";
      return "Terjadi kesalahan dalam memproses permintaan Anda.";
    } finally {
      sendButton.disabled = false;
      sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim';
    }
  }

  // =============================
  // 📨 Proses Pesan
  // =============================
  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const userMessage = { role: 'user', content: text };
    addMessage(userMessage);
    currentMessages.push(userMessage);

    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.focus();

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai';
    typingIndicator.innerHTML = `
      <div class="message-header">
        <div class="avatar ai-avatar"><i class="fas fa-robot"></i></div>
        <span>Finix-AI Asisten</span>
      </div>
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    `;
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    (async () => {
      try {
        const aiReply = await fetchAIResponse(text);
        typingIndicator.remove();
        const aiResponse = { role: 'ai', content: aiReply };
        currentMessages.push(aiResponse);
        addMessage(aiResponse);
        saveChat();
        renderChatHistory();
      } catch (error) {
        typingIndicator.remove();
        addMessage({ role: 'ai', content: "Terjadi kesalahan: " + error.message, error: true });
      }
    })();
  }

  // =============================
  // 💾 Simpan & Render Chat
  // =============================
  function saveChat() {
    const title = currentMessages[0]?.content.replace(/<[^>]*>/g, '').slice(0, 30) || 'Obrolan Baru';
    const updatedChat = {
      id: currentChatId,
      title,
      messages: [...currentMessages],
      updatedAt: new Date().toISOString()
    };

    const index = chats.findIndex(c => c.id === currentChatId);
    if (index !== -1) chats[index] = updatedChat;
    else chats.unshift({ ...updatedChat, createdAt: new Date().toISOString() });

    localStorage.setItem('finixChats', JSON.stringify(chats));
  }

  function createNewChat() {
    saveChat();
    currentChatId = `chat_${Date.now()}`;
    currentMessages = [];
    chatBox.innerHTML = '';
    addMessage({ role: 'ai', content: 'Halo! 👋 Saya Finix-AI Asisten. Ada yang bisa saya bantu hari ini?' });
    renderChatHistory();
  }

  // Jalankan inisialisasi
  init();
});
