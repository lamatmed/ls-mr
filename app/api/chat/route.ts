// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Récupère la requête du client
        const { prompt } = await req.json();

        // Effectuer la requête vers l'API Groq
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, // Remplace par ta clé API
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modèle que tu souhaites utiliser
                messages: [
                    {
                        role: 'user',
                        content: prompt, // Le prompt que l'utilisateur envoie
                    },
                ],
            }),
        });

        const data = await res.json(); // Récupère la réponse de l'API Groq

        if (!data.choices || !data.choices[0]) {
            return NextResponse.json({ error: 'Réponse inattendue de l\'API' }, { status: 500 });
        }

        // Renvoie la réponse du modèle
        return NextResponse.json({
            response: data.choices[0].message.content,
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('Erreur Groq API:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
