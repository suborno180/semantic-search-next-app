import { storage, Document, SearchResult } from './storage';
import { embeddingService } from './embedding';

export class VectorSearch {
    async semanticSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
        const startTime = performance.now();

        // Generate embedding for query
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        const documents = await storage.getAllDocuments();

        // Calculate similarities
        const results: SearchResult[] = [];

        for (const document of documents) {
            const similarity = embeddingService.cosineSimilarity(queryEmbedding, document.embedding);
            results.push({
                document,
                similarity,
                processingTime: performance.now() - startTime
            });
        }

        // Sort by similarity and limit results
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    // Brute-force search (simple but effective for small datasets)
    async bruteForceSearch(queryEmbedding: number[], documents: Document[], limit: number = 10): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const searchStartTime = performance.now();

        for (const document of documents) {
            const similarity = embeddingService.cosineSimilarity(queryEmbedding, document.embedding);
            results.push({
                document,
                similarity,
                processingTime: performance.now() - searchStartTime
            });
        }

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }
}

export const vectorSearch = new VectorSearch();