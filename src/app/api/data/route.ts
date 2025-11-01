import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { text, category, embedding } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ 
        error: 'Embedding is required and must be an array' 
      }, { status: 400 });
    }

    const document = await storage.addDocument({
      text,
      embedding,
      metadata: {
        createdAt: new Date().toISOString(),
        category,
        length: text.length
      }
    });

    const stats = await storage.getStats();

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        text: document.text.substring(0, 150) + (document.text.length > 150 ? '...' : ''),
        metadata: document.metadata
      },
      processing: {
        dimensions: embedding.length,
        totalDocuments: stats.totalDocuments
      },
      stats
    });

  } catch (error) {
    console.error('Data addition error:', error);
    return NextResponse.json({ 
      error: 'Failed to add data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const documents = await storage.getAllDocuments();
    const stats = await storage.getStats();
    
    return NextResponse.json({
      success: true,
      stats,
      recentDocuments: documents.slice(-5).map(doc => ({
        id: doc.id,
        text: doc.text.substring(0, 100) + (doc.text.length > 100 ? '...' : ''),
        metadata: doc.metadata
      }))
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}