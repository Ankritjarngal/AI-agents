import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
const readlineSync = (await import("readline-sync")).default;
import { configDotenv } from "dotenv";

configDotenv();
const api_key = process.env.google_api_key;
const api_key_2 = process.env.tomorrow_api_key;

async function city() {
    const options = {
        method: 'GET',
        headers: { accept: 'application/json' }
    }
    
    try {
        const response = await fetch(`http://api.ipapi.com/api/check?access_key=${api_key_2}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const location = await response.json();
        return location.city;
    }
    catch (err) {
        console.error("Error fetching location data:", err);
        return null;
    }
}

async function datia() {
    const ll = await city();
    if (!ll) return null;
    
    const options = {
        method: 'GET',
        headers: { accept: 'application/json' }
    };
    
    try {
        const response = await fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${ll}&apikey=fQAhvEIz1mjtcZJkDU2jQNFLCFnDaw4y`, options);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error fetching weather data:", err);
        return null;
    }
}

const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
    maxOutputTokens: 2048,
    apiKey: api_key
});

const messageHistory = [(
    new SystemMessage(`You are a specialized weather and location assistant. Your primary functions are:
        1. Answering questions about current weather conditions
        2. Providing location-specific weather information
        3. Explaining weather patterns and phenomena
        
        If a user asks questions unrelated to weather or location:
        1. Politely remind them that you're a weather specialist
        2. Guide them back to weather-related topics
        3. Suggest relevant weather-related questions they could ask instead
        
        Keep responses focused and concise. Do not engage in general conversation or non-weather topics.`)
)];

async function print(msg) {
    
    messageHistory.push(new HumanMessage(msg));
    
    try {
        const response = await model.invoke(messageHistory);
        console.log("AI:", response.content);
        messageHistory.push(response.content);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

async function runConversation() {
    const report = await datia();
    if (report) {
        await print(
            `You are a weather assistant focused on providing accurate weather information. 
            Based on this weather data: ${JSON.stringify(report)}, provide a concise summary including:
            - Current temperature
            - Humidity levels
            - Wind conditions
            - Notable weather events
            Format this as a clear, brief report without any additional commentary.`
        );

        

        while(true) {
            const userInput = readlineSync.question("You: ");
            if (userInput.toLowerCase() === "exit") {
                break;
            }
            await print(userInput);
        }
    } else {
        console.log("Unable to retrieve weather data. Please check your API keys and try again.");
    }
}

console.log("Chatbot Started......");
await runConversation();
console.log("Chatbot Ended......");