const express = require('express');
const app = express();
app.use(express.json());
// Import the Groq SDK
const Groq = require('groq-sdk');

const groq = new Groq({
      apiKey: "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"

}); // Initialize without API key if it's not needed

// In-memory storage for chat sessions, using username as sessionId
const chatSessions = {};

// Define the chat function
async function chat(username, prompt) {
  // Retrieve or initialize the chat history for the username
  if (!chatSessions[username]) {
    chatSessions[username] = [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "assistant",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ];
  }

  const history = chatSessions[username];

  // Transform history to the expected format for the API call
  const messages = history.flatMap(session =>
    session.parts.map(part => ({
      role: session.role,
      content: part.text
    }))
  );

  // Add the new user message to the history
  messages.push({
    role: "user",
    content: prompt
  });

  // Use the Groq client to get the chat completions
  const chatCompletion = await groq.chat.completions.create({
    "messages": messages,
    "model": "mixtral-8x7b-32768", // or the correct model identifier
    "temperature": 1,
    "max_tokens": 1024,
    "top_p": 1,
    "stream": true,
    "stop": null
  });

  let result = '';
  for await (const chunk of chatCompletion) {
    result += chunk.choices[0]?.delta?.content || '';
  }

  // Update the chat history with the new user message and model response
  history.push({
    role: "user",
    parts: [{ text: prompt }],
  });
  history.push({
    role: "assistant",
    parts: [{ text: result }],
  });

  // Store the updated history back to the session
  chatSessions[username] = history;

  return result;
}

// Route to handle chat messages
app.post('/history', async function(req, res) {
  try {
    const { username, prompt } = req.body;
    if (!username || !prompt) {
      return res.status(400).json({ error: 'username and prompt are required' });
    }

    const response = await chat(username, prompt);
    res.status(200).json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 3000; // or any port you prefer
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
// const Groq = require('groq-sdk');

// const groq = new Groq({
//            apiKey: "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"
// });
// async function main() {
//   const chatCompletion = await groq.chat.completions.create({
//     "messages": [
//       {
//         "role": "user",
//         "content": "who are you"
//       }
//     ],
//     "model": "mixtral-8x7b-32768",
//     "temperature": 1,
//     "max_tokens": 1024,
//     "top_p": 1,
//     "stream": true,
//     "stop": null
//   });

//   for await (const chunk of chatCompletion) {
//     process.stdout.write(chunk.choices[0]?.delta?.content || '');
//   }
// }

// main();