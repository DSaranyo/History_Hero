
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const model = "gemini-2.5-flash";

const generationConfig = {
  temperature: 0.7,
  maxOutputTokens: 2000,
};

const safetySettings = [
    {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
    },
    {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
    },
    {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
    },
];


const baseSystemInstruction = "You are a history expert for students. Your goal is to make history engaging, understandable, and accurate. Provide responses in the requested JSON format.";

const getResponse = async <T,>(prompt: string, responseSchema: any): Promise<T | null> => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...generationConfig,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: baseSystemInstruction,
      },
    });
    
    if (response.text) {
        return JSON.parse(response.text) as T;
    }
    return null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};

export const generateSummary = (text: string) => {
  const prompt = `Based on the following history chapter, generate a detailed summary.

Text: "${text}"

Provide the output in a JSON object with the following structure: {
  "summary_5_lines": "A concise 5-line summary of the chapter.",
  "key_points": ["Point 1", "Point 2", "Point 3", ...],
  "important_dates": [{"date": "Year/Date", "event": "What happened"}, ...],
  "important_people": [{"name": "Person's Name", "significance": "Their role or impact"}, ...],
  "cause_effect": [{"cause": "The cause of an event", "effect": "The resulting effect"}, ...]
}`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      summary_5_lines: { type: Type.STRING },
      key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
      important_dates: { 
        type: Type.ARRAY, 
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            event: { type: Type.STRING }
          },
          required: ["date", "event"]
        }
      },
      important_people: { 
        type: Type.ARRAY, 
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            significance: { type: Type.STRING }
          },
          required: ["name", "significance"]
        }
      },
      cause_effect: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            cause: { type: Type.STRING },
            effect: { type: Type.STRING }
          },
          required: ["cause", "effect"]
        }
      }
    },
    required: ["summary_5_lines", "key_points", "important_dates", "important_people", "cause_effect"]
  };
  
  return getResponse(prompt, schema);
};


export const generateTimeline = (text: string) => {
    const prompt = `Convert the following history text into a chronological timeline. Each event should have a year, a description of the event, and its impact.

Text: "${text}"

Provide the output as a JSON array of objects, where each object has "year", "event", and "impact" fields.
`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                year: { type: Type.STRING },
                event: { type: Type.STRING },
                impact: { type: Type.STRING },
            },
            required: ["year", "event", "impact"]
        }
    };
    return getResponse(prompt, schema);
};

export const generateFlashcards = (text: string) => {
    const prompt = `From the text below, generate a set of 20 flashcards of mixed types (Q&A, MCQ, True/False, Fill in the blanks).

Text: "${text}"

Provide the output as a JSON array of objects. Each object must have a "type" field ('qa', 'mcq', 'true_false', 'fill_up'), a "question", and an "answer". For 'mcq', also include an "options" array with 4 choices, one of which is the correct answer. For "fill_up", the question should contain "___" for the blank.
`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['qa', 'mcq', 'true_false', 'fill_up'] },
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["type", "question", "answer"]
        }
    };
    return getResponse(prompt, schema);
};

export const generateMindmap = (text: string) => {
    const prompt = `Convert the provided history text into a hierarchical mindmap structure. The top-level node should be the main topic. Create nested child nodes for sub-topics, key events, figures, and concepts.

Text: "${text}"

Provide the output as a single JSON object with a "name" for the central idea and a "children" array for its branches. Each child can have its own "children" array for further nesting.
`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            children: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        children: {
                            type: Type.ARRAY,
                            items: { '$ref': '#' }
                        }
                    },
                    required: ["name"]
                }
            }
        },
        required: ["name"]
    };
    return getResponse(prompt, schema);
};

export const generateQuiz = (text: string) => {
    const prompt = `Create a comprehensive quiz from the following text. The quiz should include exactly 10 multiple-choice questions (MCQs), 5 short answer questions, 5 one-word answer questions, and 1 long answer question.

Text: "${text}"

Provide the output as a single JSON object with keys: "mcqs", "short_answers", "one_word_questions", and "long_answer_question".
- "mcqs" should be an array of objects, each with "question", an "options" array of 4 strings, and the correct "answer".
- "short_answers" should be an array of objects with "question" and an "answer_hint".
- "one_word_questions" should be an array of objects with "question" and "answer".
- "long_answer_question" should be an object with "question" and "answer_guideline".
`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            mcqs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                    },
                    required: ["question", "options", "answer"]
                }
            },
            short_answers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        answer_hint: { type: Type.STRING },
                    },
                    required: ["question", "answer_hint"]
                }
            },
            one_word_questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING },
                    },
                    required: ["question", "answer"]
                }
            },
            long_answer_question: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer_guideline: { type: Type.STRING },
                },
                required: ["question", "answer_guideline"]
            }
        },
        required: ["mcqs", "short_answers", "one_word_questions", "long_answer_question"]
    };
    return getResponse(prompt, schema);
};
