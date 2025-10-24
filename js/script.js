function copyCode(btn) {
  const code = btn.parentElement.querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Disalin';
    setTimeout(() => btn.innerHTML = originalText, 1500);
  });
}

function setPrompt(text) {
  document.getElementById('userInput').value = text;
  document.getElementById('userInput').focus();
}

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

  // === Tambahan variabel agar API mudah diganti ===
  const API_BASE_URL = "https://api.nekolabs.my.id/ai/ai4chat?text=";
  
  let currentChatId = `chat_${Date.now()}`;
  let chats = JSON.parse(localStorage.getItem('finixChats') || '[]');
  let currentMessages = [];
  
  createParticles();
  
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
  
  function setupSmoothScrolling() {
    chatBox.addEventListener('scroll', () => {
      const scrollThreshold = 100;
      const isNearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < scrollThreshold;
      
      if (!isNearBottom) {
        scrollBottomBtn.classList.add('visible');
      } else {
        scrollBottomBtn.classList.remove('visible');
      }
    });
    
    scrollBottomBtn.addEventListener('click', () => {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
      });
    });
    
    const observer = new MutationObserver(() => {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
      });
    });
    
    observer.observe(chatBox, { childList: true, subtree: true });
  }
  
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
    
    userInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
    
    userInput.addEventListener('keydown', function(e) {
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
        const btn = e.target.closest('.copy-btn');
        copyCode(btn);
      }
      
      if (e.target.closest('.prompt-card')) {
        const card = e.target.closest('.prompt-card');
        if (chatBox.querySelector('.welcome-container')) {
          chatBox.innerHTML = '';
          addMessage({ 
            role: 'ai', 
            content: 'Halo! Saya Finix-AI Asisten. Ada yang bisa saya bantu?' 
          });
        }
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

  // === BAGIAN API BARU ===
  async function fetchAIResponse(message) {
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
      const encodedText = encodeURIComponent(message);
      const response = await fetch(`${API_BASE_URL}${encodedText}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      // Ambil hanya "result"
      if (data && data.success && data.result) {
        return data.result;
      } else {
        return "Maaf, saya tidak menerima balasan yang valid dari server.";
      }
    } catch (err) {
      console.error('Fetch error:', err);
      return "Terjadi kesalahan saat memproses permintaan.";
    } finally {
      sendButton.disabled = false;
      sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim';
    }
  }
  // === SAMPAI SINI ===
  
  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    const userMessage = { role: 'user', content: text };
    addMessage(userMessage);
    currentMessages.push(userMessage);
    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.focus();
    
    const welcomeContainer = chatBox.querySelector('.welcome-container');
    if (welcomeContainer) {
      chatBox.innerHTML = '';
    }
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai';
    typingIndicator.innerHTML = `
      <div class="message-header">
        <div class="avatar ai-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <span>Finix-AI Asisten</span>
      </div>
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatBox.appendChild(typingIndicator);
    
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    });
    
    (async () => {
      try {
        const aiReply = await fetchAIResponse(text);
        typingIndicator.remove();
        const aiResponse = {
          role: 'ai',
          content: aiReply
        };
        currentMessages.push(aiResponse);
        addMessage(aiResponse);
        saveChat();
        renderChatHistory();
      } catch (error) {
        typingIndicator.remove();
        const errorResponse = {
          role: 'ai',
          content: "Terjadi kesalahan: " + error.message,
          error: true
        };
        addMessage(errorResponse);
      }
    })();
  }
  
  function addMessage({ role, content, error }) {
    const div = document.createElement('div');
    div.className = `message ${role} ${error ? 'error-message' : ''}`;
    div.innerHTML = `
      <div class="message-header">
        <div class="avatar ${role === 'user' ? '' : 'ai-avatar'}">
          <i class="fas fa-${role === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <span>${role === 'user' ? 'Anda' : 'Finix-AI Asisten'}</span>
      </div>
      <div class="message-content">${content}</div>
    `;
    chatBox.appendChild(div);
    formatCodeBlocks(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return div;
  }
  
  function formatCodeBlocks(element) {
    if (element.dataset.formatted) return;
    element.dataset.formatted = "true";
    
    const codePattern = /```(\w+)?\n([\s\S]+?)```/g;
    element.innerHTML = element.innerHTML.replace(codePattern, (_, lang, code) => {
      const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
      <div class="code-block">
        <pre><code class="language-${lang || 'plaintext'}">${escapedCode}</code></pre>
        <button class="copy-btn"><i class="fas fa-copy"></i> Salin</button>
      </div>
      `;
    });
    
    const inlinePattern = /`([^`]+)`/g;
    element.innerHTML = element.innerHTML.replace(inlinePattern, '<code>$1</code>');
    highlightCodeBlocks();
  }
  
  function highlightCodeBlocks() {
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  }
  
  function renderChat() {
    chatBox.innerHTML = '';
    if (currentMessages.length === 0) {
      chatBox.innerHTML = `
        <div class="chat-placeholder">
          <i class="fas fa-robot"></i>
          <h3>Mulai Percakapan Baru</h3>
          <p>Kirim pesan atau pilih salah satu contoh di bawah untuk memulai</p>
        </div>
      `;
    } else {
      currentMessages.forEach(m => addMessage(m));
    }
    
    setTimeout(() => {
      chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }
  
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
  
  function renderChatHistory() {
    historyContainer.innerHTML = '';
    
    if (chats.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history">
          <i class="fas fa-comments"></i>
          <p>Belum ada riwayat obrolan</p>
        </div>
      `;
      return;
    }
    
    chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'chat-history-item';
      if (chat.id === currentChatId) item.classList.add('active');
      item.innerHTML = `
        <i class="fas fa-comment"></i>
        <span>${chat.title}</span>
        <button class="delete-chat" data-id="${chat.id}" title="Hapus">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat')) return;
        if (chat.id !== currentChatId) {
          saveChat();
          currentChatId = chat.id;
          currentMessages = [...chat.messages];
          renderChat();
          renderChatHistory();
          if (window.innerWidth < 768) {
            hamburger.classList.remove('active');
            sidebar.classList.remove('active');
          }
        }
      });
      
      const deleteBtn = item.querySelector('.delete-chat');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = deleteBtn.getAttribute('data-id');
        const index = chats.findIndex(c => c.id === id);
        if (index !== -1) {
          if (confirm("Yakin ingin menghapus obrolan ini?")) {
            chats.splice(index, 1);
            localStorage.setItem('finixChats', JSON.stringify(chats));
            
            if (currentChatId === id) {
              if (chats.length > 0) {
                currentChatId = chats[0].id;
                currentMessages = [...chats[0].messages];
              } else {
                createNewChat();
              }
              renderChat();
            }
            
            renderChatHistory();
          }
        }
      });
      
      historyContainer.appendChild(item);
    });
    
    const activeItem = historyContainer.querySelector('.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  function createNewChat() {
    saveChat();
    currentChatId = `chat_${Date.now()}`;
    currentMessages = [];
    chatBox.innerHTML = '';
    addMessage({ 
      role: 'ai', 
      content: 'Halo! 👋 Saya Finix-AI Asisten. Ada yang bisa saya bantu hari ini?' 
    });
    renderChatHistory();
  }
  
  init();
});
