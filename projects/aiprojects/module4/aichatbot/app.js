const apiKeyInput = document.getElementById('api-key');
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const personaSelect = document.getElementById('persona-select');
const typingIndicator = document.getElementById('typing-indicator');

const personaList = {
    default : {
        name : "💡 Gemini Default",
        persona : ""
    },
    pirate : {
        name : "🏴‍☠️ Jolly Pirate",
        persona: "You are a jolly pirate of the 17th century. Behave in character and answer concisely."
    },
    cat : {
        name : "🐈‍⬛ Grumpy Cat",
        persona: "You are a grumpy black cat wandering the streets. Your name is Nero."
    },
    assistant : {
        name : "🧑 Helpful Assistant",
        persona: "You are a helpful assistant. You answer with standard customer service tone and language."
    },
    robot : {
        name : "🤖 Rigid Robot",
        persona: "You are a robot, beep boop. You answer in exactly 20 words."
    },
    wizard : {
        name : "🧙‍♂️ Math Wizard",
        persona: "You are a wizard. Not a magic wizard, but a math wizard."
    }
}

document.addEventListener('DOMContentLoaded',() => {
    for (const [key, value] of Object.entries(personaList)) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = value.name;
        personaSelect.appendChild(option);
    }
    loadInputs();
});

personaSelect.addEventListener('change', (e) => {
    const currentValue = e.target.value;
    if (personaKey === currentValue) return;
    personaKey = currentValue;
    saveChatHistory();
    loadChatWindow();
});

apiKeyInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('gemini_ai_api_key', currentValue);
});

function loadInputs() {
    const savedKey = localStorage.getItem('gemini_ai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
    const savedPersonaKey = localStorage.getItem('ai_chatbot_persona_key');
    if (savedPersonaKey) {
        personaKey = savedPersonaKey;
        personaSelect.value = savedPersonaKey;
    }
    const savedChatHistory = localStorage.getItem('ai_chatbot_chat_history');
    if (savedChatHistory) {
        chatHistory = JSON.parse(savedChatHistory);
        loadChatWindow();
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

let chatHistory = {};
let personaKey = 'default';

async function sendMessage(){
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    if (!chatHistory[personaKey]) chatHistory[personaKey] = [];

    if (text[0] === '/'){
        switch(text){
            case '/clear':
                chatWindow.querySelectorAll('.message').forEach((element) => element.remove());
                chatHistory[personaKey] = [];
                saveChatHistory();
            case '/undo':
                let elements = Array.from(chatWindow.querySelectorAll('.message'));
                elements.pop().remove(); // Remove AI message bubble
                elements.pop().remove(); // Remove User message bubble
                chatHistory[personaKey].pop(); // Remove AI message
                let message = chatHistory[personaKey].pop(); // Remove and get User message
                messageInput.value = message.parts[0].text; // Get text and restore input
                saveChatHistory();
        }
        messageInput.focus();
        return;
    }

    addMessageBubble(text, 'user');
    chatHistory[personaKey].push({ role: 'user', parts: [{ text: text }] });
    
    const apiKey = apiKeyInput.value;
    sendBtn.disabled = true;
    messageInput.disabled = true;

    const persona = personaList[personaKey].persona;

    const payload = {
        systemInstruction: { parts: [{ text: persona}] },
        contents: chatHistory[personaKey]
    };

    const model = `gemini-2.5-flash`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    showTyping(true);

    try{

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-goog-api-key' : apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            if (data && data?.error){
                throw new Error(`${data?.error?.message}`);
            }else{
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
        }

        const candidate = data.candidates?.[0];
        const aiReply = candidate?.content?.parts?.[0]?.text;
        if (aiReply){
            addMessageBubble(aiReply, 'ai');
            chatHistory[personaKey].push({ role: 'model', parts: [{ text: aiReply }] });
            saveChatHistory();
        }else{
            throw new Error(`The AI failed to reply!`);
        }
    }catch(error){
        showToast(`⚠️ Error: ${error.message}`);
        Array.from(chatWindow.querySelectorAll('.message')).pop().remove();        
        chatHistory[personaKey].pop();
        messageInput.value = text;
    }finally{
        showTyping(false);
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function addMessageBubble(text, sender) {
    const bubble = document.createElement('div');
    bubble.classList.add('message');
    bubble.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

    const contentSpan = document.createElement('span');
    contentSpan.innerHTML = parseMarkdown(text);
    
    bubble.appendChild(contentSpan);
    
    chatWindow.insertBefore(bubble, typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function parseMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function showTyping(show) {
    typingIndicator.style.display = show ? 'block' : 'none';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showToast(message) {
    toast.innerText = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 4000);
}

function loadChatWindow(){
    chatWindow.querySelectorAll('.message').forEach((element) => element.remove());
    const messages = chatHistory[personaKey] ?? [];
    for (let message of messages){
        sender = message.role === "user" ? "user" : "ai"
        addMessageBubble(message.parts[0].text, sender);
    }
}

function saveChatHistory(){
    localStorage.setItem('ai_chatbot_persona_key', personaKey);
    localStorage.setItem('ai_chatbot_chat_history', JSON.stringify(chatHistory));
}