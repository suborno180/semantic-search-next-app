import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '@/lib/embedding';

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const embedding = await embeddingService.generateEmbedding(text);

        return NextResponse.json({
            embedding,
            dimensions: embedding.length,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
    } catch (error) {
        console.error('Embedding error:', error);
        return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
    }
}