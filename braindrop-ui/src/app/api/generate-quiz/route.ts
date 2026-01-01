import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { topic, count = 4 } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 });
        }

        // Read RAG Context
        const contextPath = path.join(process.cwd(), 'src/lib/quiz-context.md');
        let contextContent = '';
        try {
            contextContent = await fs.readFile(contextPath, 'utf8');
        } catch (e) {
            console.error('Failed to read context file:', e);
            // Fallback context if file missing
            contextContent = 'Generate a multiple choice question in JSON format.';
        }

        // Construct Prompt
        const prompt = `
Context Rules:
${contextContent}

Task:
Generate a quiz question about "${topic}".
You MUST generate exactly ${count} answers. One correct, and ${(count as number) - 1} incorrect.
Remember to follow the JSON structure strictly.
`;

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch from Gemini API' }, { status: response.status });
        }

        const data = await response.json();

        // Extract text from response
        let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return NextResponse.json({ error: 'No content generated' }, { status: 500 });
        }

        // Clean markdown code blocks if present ( ```json ... ``` )
        generatedText = generatedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        // Parse JSON
        let quizData;
        try {
            quizData = JSON.parse(generatedText);
        } catch (e) {
            console.error('JSON Parse Error:', e, 'Raw Text:', generatedText);
            return NextResponse.json({ error: 'Failed to parse generated content' }, { status: 500 });
        }

        return NextResponse.json(quizData);

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
