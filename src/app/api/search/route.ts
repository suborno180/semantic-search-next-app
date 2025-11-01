import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Document } from '@/lib/storage';

// Server-side similarity calculation (no TensorFlow.js needed)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(request: NextRequest) {
  try {
    const { query, queryEmbedding, limit = 10 } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return NextResponse.json({ 
        error: 'Query embedding is required and must be an array' 
      }, { status: 400 });
    }

    const startTime = performance.now();
    const documents = await storage.getAllDocuments();
    
    // Calculate similarities
    const results = documents.map(document => {
      const similarity = cosineSimilarity(queryEmbedding, document.embedding);
      return {
        document: {
          id: document.id,
          text: document.text,
          metadata: document.metadata
        },
        similarity,
        processingTime: performance.now() - startTime
      };
    });
    
    // Sort by similarity and limit results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      query,
      results: sortedResults,
      totalResults: sortedResults.length,
      processingTime: sortedResults[0]?.processingTime || 0
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}