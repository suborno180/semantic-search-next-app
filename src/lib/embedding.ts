import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

class EmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;
  private isLoaded = false;
  private backendInitialized = false;

  // Public getter for model status
  get modelStatus() {
    return {
      isLoaded: this.isLoaded,
      backendInitialized: this.backendInitialized,
      backend: typeof window !== 'undefined' ? tf.getBackend() : 'server'
    };
  }

  async initializeBackend() {
    if (this.backendInitialized) return;
    
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      this.backendInitialized = true;
      return;
    }
    
    try {
      // Try WebGL first for better performance
      await tf.setBackend('webgl');
      console.log('WebGL backend initialized');
      this.backendInitialized = true;
    } catch (error) {
      console.warn('WebGL backend failed, falling back to CPU:', error);
      try {
        await tf.setBackend('cpu');
        this.backendInitialized = true;
        console.log('CPU backend initialized as fallback');
      } catch (cpuError) {
        console.error('CPU backend also failed:', cpuError);
        throw new Error('No TensorFlow.js backend available');
      }
    }
  }

  async loadModel() {
    if (this.isLoaded) return;
    
    console.log('Loading Universal Sentence Encoder...');
    
    try {
      await this.initializeBackend();
      
      // Only load model in browser environment
      if (typeof window !== 'undefined') {
        this.model = await use.load();
        this.isLoaded = true;
        console.log('Model loaded successfully');
      } else {
        console.log('Skipping model load on server side');
        this.isLoaded = true; // Mark as loaded to prevent repeated attempts
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Only generate embeddings in browser environment
    if (typeof window === 'undefined') {
      throw new Error('Embedding can only be generated in browser environment');
    }

    if (!this.model) {
      await this.loadModel();
    }

    try {
      console.log('Generating embedding for text:', text.substring(0, 50) + '...');
      
      const embeddings = await this.model!.embed([text]);
      const vector = await embeddings.array();
      
      // Properly dispose tensors to prevent memory leaks
      embeddings.dispose();
      
      console.log('Embedding generated successfully, dimensions:', vector[0].length);
      return vector[0];
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    const similarity = dotProduct / (magnitudeA * magnitudeB);
    // Ensure similarity is between -1 and 1
    return Math.max(-1, Math.min(1, similarity));
  }
}

export const embeddingService = new EmbeddingService();