const apiKeyInput = document.getElementById("api-key");
const storyDiv = document.getElementById("story-output");
const userInput = document.getElementById("user-input");
const goBtn = document.getElementById("go-btn");
const moodPicker = document.getElementById("mood-picker");
const worldSelect = document.getElementById("world-select");
const resetBtn = document.getElementById("reset-btn");
const modal = document.getElementById("reset-modal");
const confirmResetBtn = document.getElementById("confirm-reset-btn");
const cancelResetBtn = document.getElementById("cancel-reset-btn");

apiKeyInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('gemini_ai_api_key', currentValue);
});

function loadInputs() {
    const savedKey = localStorage.getItem('gemini_ai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
}
loadInputs();

let storyMemory = "";

goBtn.addEventListener("click", async () => {
    setLoading(true);
    await continueStory();
    setLoading(false);
});

async function continueStory(){
    const apiKey = apiKeyInput.value;
    const userText = userInput.value;
    let mood = moodPicker.value;
    let world = worldSelect.value;
    switch(mood){
        case "happy": mood = "You are happy, and write with a jolly voice."; break;
        case "scared": mood = "You feel scared, and write with a nervous, shaky voice."; break;
        case "angry": mood = "You are angry, and write with a grumpy voice."; break;
        case "silly": mood = "You feel silly, and write with a funny voice full of emojis!"; break;
        case "poetic": mood = "You feel poetic, and write in poems and riddles."; break;
    }
    switch (world){
        case "fantasy": world = "You are a fantasy writer."; break;
        case "space": world = "You write stories that take place in a space station."; break;
        case "jungle": world = "You excel in writing deep jungle scenes."; break;
        case "ocean": world = "You like to write underwater scenes."; break;
        case "cyberpunk": world = "You write cyberpunk stories."; break;
    }

    storyDiv.querySelectorAll(`.placeholder-text`).forEach(child => child.remove());
    storyDiv.querySelectorAll(`.error-text`).forEach(child => child.remove());

    let system_instruction = `You are TAL-E, a storyteller AI. ${mood} ${world}`;

    let prompt = "";
    if (storyDiv.innerHTML === "" && userText){
        prompt = `Create a new story based on the premise in the user input.

        User Input:
        ${userText}.

        Write the beginning of the story in a single paragraph. Introduce the characters and settings. Show only the story text.`
    }
    else if (storyDiv.innerHTML === "" && !userText){
        prompt = `Create a new story for users to continue.

        Write the beginning of the story in a single paragraph with 3 sentences. Introduce the characters and settings. Show only the story text.`
    }
    else if (storyDiv.innerHTML === "" && userText){
        prompt = `Continue the story based on user input.

        Current Story:
        ${storyMemory}

        User Input:
        ${userText}

        Continue the story in maximum 3 sentences.`
    }else{
        prompt = `Continue the current story.

        Current Story:
        ${storyMemory}

        Continue the story in maximum 3 sentences.`
    }

    if (userText) {
        let spacing = storyDiv.innerHTML === "" ? "" : "<br><br>";
        storyDiv.innerHTML += `<span class="user-text">${spacing}You: ${userText}</span>`;
    }
    storyDiv.scrollTop = storyDiv.scrollHeight;

    const loadingSpan = document.createElement("span");
    loadingSpan.className = "pulsing";
    let spacing = storyDiv.innerHTML === "" ? "" : "<br><br>";
    loadingSpan.innerHTML = `${spacing}TAL-E is thinking...`;
    storyDiv.appendChild(loadingSpan);
    
    
    userInput.value = "";

    const payload = {
            contents: [{ parts: [{ text: prompt }] }]
    };
    payload.system_instruction = {
            parts: [{ text: system_instruction }]
    };

    const model = `gemini-3-flash-preview`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
        loadingSpan.remove();
        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason;
        if (finishReason !== 'STOP'){
            throw new Error(`TAL-E refuses to write! Reason: ${finishReason}`);
        }
        const aiReply = candidate?.content?.parts?.[0]?.text;
        if (aiReply){
            let spacing = storyDiv.innerHTML === "" ? "" : "\n\n";
            const aiSpan = document.createElement("span");
            aiSpan.className = "ai-text";
            storyDiv.appendChild(aiSpan);
            await typeWriter(aiSpan, spacing + aiReply, 5);
            storyMemory += aiReply;
        }
    }catch(error){
        if(loadingSpan.parentNode) loadingSpan.remove();
        storyDiv.innerHTML += `<div class="error-text">❌ Oops! ${error.message}</div>`;
        storyDiv.scrollTop = storyDiv.scrollHeight;
        userInput.value = userText;
        if (userText){
            let elements = storyDiv.querySelectorAll(`.user-text`);
            elements[elements.length - 1].remove();
        }
    }
}

function setLoading(isLoading){
    if (isLoading){
        goBtn.disabled = true;
        userInput.disabled = true;
    }else{
        goBtn.disabled = false;
        userInput.disabled = false;
    }
}

function typeWriter(element, text, speed = 30) {
    return new Promise(resolve => {
        const chunks = text.split(/(\s+)/); 

        let i = 0;
        function type() {
            if (i < chunks.length) {
                element.innerHTML += chunks[i];
                storyDiv.scrollTop = storyDiv.scrollHeight; // Auto-scroll
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

resetBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

cancelResetBtn.addEventListener("click", () => {
     modal.style.display = "none";
});

confirmResetBtn.addEventListener("click", () => {
    storyDiv.innerHTML = `<span class="placeholder-text">Once upon a time, waiting for an adventure...</span>`;
    userInput.value = "";
    userInput.disabled = false;
    goBtn.disabled = false;
    modal.style.display = "none";
});