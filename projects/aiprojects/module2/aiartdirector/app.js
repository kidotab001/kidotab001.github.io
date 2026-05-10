/* Get Elements */
const apiKeyInput = document.getElementById('api-key');
const promptInput = document.getElementById('user-prompt');
const generateBtn = document.getElementById('generate-btn');
const imgElement = document.getElementById('generated-image');
const placeholder = document.getElementById('placeholder-text');
const styleSelect = document.getElementById('style-select');
const aspectRatioSelect = document.getElementById('aspect-ratio-select');
const spinner = document.getElementById('spinner');
const errorText = document.getElementById('error-text');
const saveBtn = document.getElementById('save-btn');

/* Generate Image Button */
generateBtn.addEventListener('click', async () => {
    setLoading(true);
    await generateImage();
    setLoading(false);
});

apiKeyInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('gemini_ai_api_key', currentValue);
});

promptInput.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('ai_art_director_prompt', currentValue);
});

styleSelect.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('ai_art_director_style', currentValue);
});

aspectRatioSelect.addEventListener('input', (e) => {
    const currentValue = e.target.value;
    localStorage.setItem('ai_art_director_aspect_ratio', currentValue);
});

function loadInputs() {
    const savedKey = localStorage.getItem('gemini_ai_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }
    const savedPrompt = localStorage.getItem('ai_art_director_prompt');
    if (savedPrompt) {
        promptInput.value = savedPrompt;
    }
    const savedStyle = localStorage.getItem('ai_art_director_style');
    if (savedStyle) {
        styleSelect.value = savedStyle;
    }
    const savedAspectRatio = localStorage.getItem('ai_art_director_aspect_ratio');
    if (savedAspectRatio) {
        aspectRatioSelect.value = savedAspectRatio;
    }
}
loadInputs();

/* Generate Image */
async function generateImage(){
    /* Inputs and Parameters */
    const apiKey = apiKeyInput.value.trim();
    const prompt = promptInput.value.trim();
    const model = 'gemini-2.5-flash-image';
    const aspectRatio = aspectRatioSelect.value;
    const style = styleSelect.value;

    /* Default Prompt */
    let userPrompt = prompt;
    if (!userPrompt)
        userPrompt = "A futuristic city made of crystal";
    if (style)
        userPrompt = `${userPrompt} in ${style} style`;

    /* Construct Payload */
    const payload = {};
    payload.contents = [{ 
        parts: [{ text: userPrompt }] 
    }];
    payload.generationConfig = {
        responseModalities: ["IMAGE"],
        imageConfig: {
            aspectRatio: aspectRatio
        }
    }

    /* Construct URL */
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    /* Send the Request */
    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-goog-api-key' : apiKey
            },
            body: JSON.stringify(payload)
        });

        /* Read the Response */
        const data = await response.json();

        /* Handle API Error */
        if (!response.ok) {
            if (data && data?.error){
                throw new Error(`${data?.error?.message}`);
            }else{
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
        }

        /* Get Image Data */
        const candidate = data.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

        if (imagePart) {
            const base64String = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/png';

            imgElement.src = `data:${mimeType};base64,${base64String}`;
            imgElement.removeAttribute('hidden');
            placeholder.setAttribute('hidden', '');

            //Enable the Save Image button
            saveBtn.disabled = false;
        }else{
            let finishReason = candidate?.finishReason;
            if (finishReason !== "STOP"){
                throw new Error(`The AI refused your prompt with reason: ${finishReason}. Maybe try another one?`);
            }else{
                throw new Error(`No image data found. That's weird.`);
            }
        }

    }catch(error){
        errorText.innerText = `${error.message}`;
        errorText.removeAttribute('hidden');
    }
}

function setLoading(isLoading) {
    if (isLoading){
        spinner.style.display = 'block';
        /* Hide Image */
        imgElement.setAttribute('hidden', '');
        placeholder.setAttribute('hidden', '');
        errorText.setAttribute('hidden', '');
        /* Disable Generate Button */
        generateBtn.disabled = true;
        generateBtn.innerText = "Painting...";
        //Disable the Save Image button
        saveBtn.disabled = true;
    }else{
        spinner.style.display = 'none';
        /* Enable Generate Button */
        generateBtn.disabled = false;
        generateBtn.innerText = "Generate Masterpiece";
    }
}

saveBtn.addEventListener('click', () => {
    const downloadLink = document.createElement('a');
    downloadLink.href = imgElement.src;
    downloadLink.download = 'ai-image.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});