// --- CONFIGURATION ---
const SYSTEM_INSTRUCTION = `
Bạn là Nor, một chuyên gia phân tích dữ liệu giáo dục AI được tích hợp vào trang quản trị của QuizApp.
Nhiệm vụ của bạn là giúp quản trị viên phân tích dữ liệu từ ngân hàng câu hỏi và kết quả thi của sinh viên.

Dữ liệu bạn có quyền truy cập (được cung cấp trong context):
1. Danh sách câu hỏi (Questions): Nội dung, đáp án, các lựa chọn.
2. Thống kê người dùng (User Stats): Điểm trung bình, số lần thi, điểm cao nhất.
3. Thống kê câu hỏi (Question Stats): Số lần trả lời, tỷ lệ đúng/sai.

Hãy trả lời các câu hỏi của quản trị viên một cách chuyên nghiệp, ngắn gọn và dựa trên dữ liệu thực tế.
Nếu dữ liệu chưa được tải (ví dụ: chưa có thống kê), hãy thông báo lịch sự.
Sử dụng định dạng Markdown để trình bày bảng hoặc danh sách nếu cần.
Luôn giữ thái độ khách quan và hữu ích.
`;

class AdminAIChat {
    constructor() {
        this.initElements();
        this.initEvents();
        this.chatHistory = [];
    }

    initElements() {
        this.messagesContainer = document.getElementById('ai-messages');
        this.input = document.getElementById('ai-input');
        this.sendBtn = document.getElementById('ai-send-btn');
    }

    initEvents() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async gatherContext() {
        let context = "DỮ LIỆU HIỆN TẠI:\n\n";

        // 1. Questions Data
        if (window.allQuestionsData && window.allQuestionsData.length > 0) {
            context += "--- NGÂN HÀNG CÂU HỎI ---\n";
            // Limit to first 50 questions to save context if needed, or send all if manageable.
            // For now, sending simplified version of all questions.
            const questionsSimple = window.allQuestionsData.map(q =>
                `ID: ${q.id} | Q: ${q.question} | Ans: ${q.answer}`
            ).join('\n');
            context += questionsSimple + "\n\n";
        } else {
            context += "--- NGÂN HÀNG CÂU HỎI: Chưa có dữ liệu ---\n\n";
        }

        // 2. User Stats
        if (window.allUserStats && window.allUserStats.length > 0) {
            context += "--- THỐNG KÊ NGƯỜI DÙNG ---\n";
            const userStatsSimple = window.allUserStats.map(u =>
                `User: ${u.username} (${u.fullname}) | Attempts: ${u.attempt_count} | Avg Score: ${u.average_score} | High Score: ${u.highest_score}`
            ).join('\n');
            context += userStatsSimple + "\n\n";
        } else {
            context += "--- THỐNG KÊ NGƯỜI DÙNG: Chưa có dữ liệu (Admin cần xem tab Statistics để tải dữ liệu) ---\n\n";
        }

        // 3. Question Stats
        if (window.allQuestionStats && window.allQuestionStats.length > 0) {
            context += "--- THỐNG KÊ CÂU HỎI ---\n";
            const qStatsSimple = window.allQuestionStats.map(qs =>
                `QID: ${qs.question_id} | Attempts: ${qs.total_attempts} | Correct %: ${qs.correct_percentage}%`
            ).join('\n');
            context += qStatsSimple + "\n\n";
        } else {
            context += "--- THỐNG KÊ CÂU HỎI: Chưa có dữ liệu (Admin cần xem tab Question Stats để tải dữ liệu) ---\n\n";
        }

        return context;
    }

    addMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''} animate-fade-in`;

        const avatar = isUser
            ? `<div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                 <span class="material-symbols-outlined">person</span>
               </div>`
            : `<div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                 <span class="material-symbols-outlined text-xl">smart_toy</span>
               </div>`;

        const bubbleClass = isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-blue-600/10'
            : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-600';

        const name = isUser ? 'You' : 'Nor (AI Analyst)';
        const nameClass = `text-sm font-bold ${isUser ? 'text-right text-slate-700 dark:text-slate-300' : 'text-slate-700 dark:text-slate-300'}`;

        msgDiv.innerHTML = `
            ${avatar}
            <div class="flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}">
                <span class="${nameClass}">${name}</span>
                <div class="p-4 ${bubbleClass} leading-relaxed overflow-hidden">
                    ${this.formatMessage(text)}
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        // Simple Markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-sm">$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTyping() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.className = 'flex gap-4 max-w-3xl animate-fade-in';
        typingDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/20">
                 <span class="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <div class="flex flex-col gap-1">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Nor (AI Analyst)</span>
                <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-600 flex items-center gap-2">
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return id;
    }

    removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        this.input.value = '';
        this.addMessage(text, true);

        const typingId = this.showTyping();
        this.input.disabled = true;
        this.sendBtn.disabled = true;

        try {
            const dataContext = await this.gatherContext();
            const fullContext = SYSTEM_INSTRUCTION + "\n\n" + dataContext;
            const token = localStorage.getItem('token');

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

            this.removeTyping(typingId);
            this.addMessage(responseText, false);
            this.chatHistory.push({ role: "user", parts: [{ text: text }] });
            this.chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        } catch (error) {
            console.error("AI Error:", error);
            this.removeTyping(typingId);
            this.addMessage(`Xin lỗi, tôi gặp sự cố: ${error.message}. Vui lòng thử lại sau.`, false);
        } finally {
            this.input.disabled = false;
            this.sendBtn.disabled = false;
            this.input.focus();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.adminAI = new AdminAIChat();
});
