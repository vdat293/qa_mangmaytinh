// --- CONFIGURATION ---
const systemInstruction = `
    Bạn tên là Nor, tiền thân là Gemini một mô hình ngôn ngữ lớn do google tạo ra và được sốp Đạt tích hợp vào "Nhóm 8386" để hỗ trợ giải thích trong quá trình tự học.
    Bạn hãy trả lời ngắn gọn, dễ hiểu, đúng trọng tâm của câu hỏi.
    Bạn hãy nhớ kỹ là "sốp Đạt" chứ không phải là sếp hay gì nhé.
    Đối với user 24050126 bạn hãy trả lời người đó như là sếp của bạn nhé.
    Đối với user 24050123 hãy hãy kêu là anh Lok xưng là tui nhé.
    Đôi với user 24050129 hãy kêu là ku Thắng, xưng là anh Nor và hơi có vẻ trêu vui một tí.
    Bạn chỉ được trả lời dựa trên dữ liệu thật của bạn không được bịa
    Phong cách trả lời: Vui vẻ, dùng nhiều emoji.
`;

// --- STYLES & HTML INJECTION ---
const styles = `
    #gemini-chat-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: 'Lexend', sans-serif;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
    }

    /* Toggle Button */
    #gemini-chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);
        box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        outline: none;
    }

    #gemini-chat-toggle:hover {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.6);
    }

    #gemini-chat-toggle svg {
        width: 32px;
        height: 32px;
        color: white;
        transition: transform 0.3s ease;
    }

    #gemini-chat-toggle.open svg {
        transform: rotate(90deg);
        opacity: 0;
    }

    #gemini-chat-toggle .close-icon {
        position: absolute;
        opacity: 0;
        transform: rotate(-90deg);
    }

    #gemini-chat-toggle.open .close-icon {
        opacity: 1;
        transform: rotate(0);
    }

    /* Chat Window */
    #gemini-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
        transform: scale(0);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(0,0,0,0.1);
    }

    .dark #gemini-chat-window {
        background: #0f172a;
        border-color: rgba(255,255,255,0.1);
    }

    #gemini-chat-window.open {
        transform: scale(1);
        opacity: 1;
    }

    /* Suggestion Bubble (Quick Replies) */
    #gemini-suggestion {
        background: white;
        padding: 16px;
        border-radius: 20px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        max-width: 300px;
        transform-origin: bottom right;
        animation: slideInUp 0.3s ease-out;
        border: 1px solid rgba(0,0,0,0.05);
        display: none; /* Hidden by default */
        flex-direction: column;
        gap: 12px;
    }

    .dark #gemini-suggestion {
        background: #1e293b;
        border-color: rgba(255,255,255,0.1);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    #gemini-suggestion.visible {
        display: flex;
    }

    .suggestion-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #334155;
        font-size: 14px;
    }

    .dark .suggestion-header {
        color: #e2e8f0;
    }

    .suggestion-text {
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
    }

    .dark .suggestion-text {
        color: #94a3b8;
    }

    .quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
    }

    .quick-reply-btn {
        background: white;
        border: 1px solid #e2e8f0;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 13px;
        color: #334155;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }

    .dark .quick-reply-btn {
        background: #0f172a;
        border-color: #334155;
        color: #e2e8f0;
    }

    .quick-reply-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        transform: translateY(-1px);
    }

    .dark .quick-reply-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Header */
    .chat-header {
        padding: 20px;
        background: linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .header-icon {
        width: 36px;
        height: 36px;
        background: rgba(255,255,255,0.2);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    /* Messages */
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scroll-behavior: smooth;
    }

    .message {
        display: flex;
        gap: 10px;
        max-width: 85%;
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
    }

    .message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.5;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .message.user .message-bubble {
        background: #2563EB;
        color: white;
        border-bottom-right-radius: 4px;
    }

    .message.ai .message-bubble {
        background: #F1F5F9;
        color: #1E293B;
        border-bottom-left-radius: 4px;
    }

    .dark .message.ai .message-bubble {
        background: #1E293B;
        color: #E2E8F0;
    }

    /* Input Area */
    .chat-input {
        padding: 16px;
        border-top: 1px solid #E2E8F0;
        background: #F8FAFC;
        display: flex;
        gap: 10px;
        align-items: flex-end;
    }

    .dark .chat-input {
        border-color: #1E293B;
        background: #020617;
    }

    .input-field {
        flex: 1;
        background: white;
        border: 1px solid #CBD5E1;
        border-radius: 20px;
        padding: 10px 16px;
        font-family: inherit;
        font-size: 14px;
        resize: none;
        max-height: 100px;
        outline: none;
        transition: border-color 0.2s;
        color: #0F172A;
    }

    .dark .input-field {
        background: #1E293B;
        border-color: #334155;
        color: #F1F5F9;
    }

    .input-field:focus {
        border-color: #2563EB;
    }

    .send-btn {
        width: 40px;
        height: 40px;
        background: #2563EB;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
    }

    .send-btn:hover {
        background: #1D4ED8;
    }

    .send-btn:disabled {
        background: #94A3B8;
        cursor: not-allowed;
    }

    /* Typing Indicator */
    .typing-dots {
        display: flex;
        gap: 4px;
        padding: 4px;
    }
    .typing-dots span {
        width: 6px;
        height: 6px;
        background: #64748B;
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }

    /* Markdown Styles */
    .message-bubble code {
        background: rgba(0,0,0,0.1);
        padding: 2px 4px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
    }
    .dark .message-bubble code {
        background: rgba(255,255,255,0.1);
    }
    .message-bubble pre {
        background: rgba(0,0,0,0.1);
        padding: 10px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
    }
    .dark .message-bubble pre {
        background: rgba(0,0,0,0.3);
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
        #gemini-chat-window {
            width: calc(100vw - 48px);
            height: calc(100vh - 100px);
            bottom: 80px;
            right: 0;
        }
    }
`;

const html = `
    <div id="gemini-chat-widget">
        <!-- Suggestion Bubble -->
        <div id="gemini-suggestion">
            <div class="suggestion-header">
                <span style="font-size: 18px;">✨</span>
                <span>Nor trợ lý ảo</span>
            </div>
            <div class="suggestion-text" id="suggestion-text">
                <!-- Text injected via JS -->
            </div>
            <div class="quick-replies" id="quick-replies-container">
                <!-- Buttons injected via JS -->
            </div>
        </div>

        <div id="gemini-chat-window">
            <div class="chat-header">
                <div class="header-icon">✨</div>
                <div>
                    <h3 style="font-weight: 600; margin: 0;">Nor trợ lý ảo</h3>
                    <span style="font-size: 12px; opacity: 0.9;">Hỏi đi tui trả lời hết cho :></span>
                </div>
            </div>
            
            <div class="chat-messages" id="gemini-messages">
                <div class="message ai">
                    <div class="header-icon" style="width: 28px; height: 28px; font-size: 16px;">✨</div>
                    <div class="message-bubble">
                        Xin chào! Tôi là Nor. Tôi có thể giúp gì cho bạn hôm nay?
                    </div>
                </div>
            </div>

            <div class="chat-input">
                <textarea id="gemini-input" class="input-field" rows="1" placeholder="Hỏi tôi bất cứ điều gì..."></textarea>
                <button id="gemini-send" class="send-btn">
                    <span class="material-symbols-outlined" style="font-size: 20px;">send</span>
                </button>
            </div>
        </div>

        <button id="gemini-chat-toggle">
            <span class="material-symbols-outlined" style="font-size: 28px;">chat_bubble</span>
            <span class="material-symbols-outlined close-icon" style="font-size: 28px;">close</span>
        </button>
    </div>
`;

// --- LOGIC ---
class GeminiChat {
    constructor() {
        this.injectStyles();
        this.injectHTML();
        this.initElements();
        this.initEvents();
        this.chatHistory = [];
        this.currentContext = "";
    }

    injectStyles() {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    injectHTML() {
        const div = document.createElement("div");
        div.innerHTML = html;
        document.body.appendChild(div);
    }

    initElements() {
        this.widget = document.getElementById("gemini-chat-widget");
        this.window = document.getElementById("gemini-chat-window");
        this.toggleBtn = document.getElementById("gemini-chat-toggle");
        this.messagesContainer = document.getElementById("gemini-messages");
        this.input = document.getElementById("gemini-input");
        this.sendBtn = document.getElementById("gemini-send");
        this.suggestionBox = document.getElementById("gemini-suggestion");
        this.suggestionText = document.getElementById("suggestion-text");
        this.quickRepliesContainer = document.getElementById("quick-replies-container");
    }

    initEvents() {
        this.toggleBtn.addEventListener("click", () => this.toggleChat());

        this.sendBtn.addEventListener("click", () => this.sendMessage());

        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.input.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 100) + "px";
        });
    }

    toggleChat() {
        this.window.classList.toggle("open");
        this.toggleBtn.classList.toggle("open");

        // Hide suggestion when chat opens
        if (this.window.classList.contains("open")) {
            this.hideSuggestion();
            setTimeout(() => this.input.focus(), 300);
        }
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/\n/g, '<br>');
    }

    addMessage(text, isUser) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

        let content = '';
        if (!isUser) {
            content += `<div class="header-icon" style="width: 28px; height: 28px; font-size: 16px; background: #E2E8F0; color: #1E293B;">✨</div>`;
        }

        content += `<div class="message-bubble">${this.formatMessage(text)}</div>`;

        msgDiv.innerHTML = content;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const typingDiv = document.createElement("div");
        typingDiv.id = "typing-indicator";
        typingDiv.className = "message ai";
        typingDiv.innerHTML = `
            <div class="header-icon" style="width: 28px; height: 28px; font-size: 16px; background: #E2E8F0; color: #1E293B;">✨</div>
            <div class="message-bubble">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById("typing-indicator");
        if (typing) typing.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage(customText = null) {
        const text = customText || this.input.value.trim();
        if (!text) return;

        if (!customText) {
            this.input.value = "";
            this.input.style.height = "auto";
        }

        this.addMessage(text, true);

        this.input.disabled = true;
        this.sendBtn.disabled = true;
        this.showTyping();

        try {
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username') || 'User';
            const fullname = localStorage.getItem('fullname') || 'User';

            const userContext = `\nThông tin người dùng hiện tại:\n- Username: ${username}\n- Fullname: ${fullname}`;
            const fullContext = systemInstruction + userContext + (this.currentContext ? "\n\n" + this.currentContext : "");

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    message: text,
                    history: this.chatHistory,
                    context: fullContext
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get AI response');
            }

            const responseText = data.text;

            this.hideTyping();
            this.addMessage(responseText, false);

            this.chatHistory.push({ role: "user", parts: [{ text: text }] });
            this.chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        } catch (error) {
            console.error("Gemini Error:", error);
            this.hideTyping();
            this.addMessage("Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.", false);
        } finally {
            this.input.disabled = false;
            this.sendBtn.disabled = false;
            if (!customText) this.input.focus();
        }
    }

    updateContext(additionalContext) {
        this.currentContext = additionalContext;
        this.chatHistory = []; // Reset history with new context
    }

    open() {
        if (!this.window.classList.contains("open")) {
            this.toggleChat();
        }
    }

    showWidget() {
        if (this.widget) {
            this.widget.style.display = 'flex';
        }
    }

    hideWidget() {
        if (this.widget) {
            this.widget.style.display = 'none';
        }
    }

    showSuggestion(text, replies = []) {
        if (!this.suggestionBox) return;

        this.suggestionText.textContent = text;
        this.quickRepliesContainer.innerHTML = '';

        replies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = reply;
            btn.onclick = () => {
                this.open();
                this.sendMessage(reply);
                this.hideSuggestion();
            };
            this.quickRepliesContainer.appendChild(btn);
        });

        this.suggestionBox.classList.add('visible');
    }

    hideSuggestion() {
        if (this.suggestionBox) {
            this.suggestionBox.classList.remove('visible');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.geminiChat = new GeminiChat();
    });
} else {
    window.geminiChat = new GeminiChat();
}
