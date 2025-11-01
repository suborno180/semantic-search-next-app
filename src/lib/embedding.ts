import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';

class EmbeddingService {
  private model: use.UniversalSentenceEncoder | null = null;
  private isLoaded = false;
  private backendInitialized = false;

  async initializeBackend() {
    if (this.backendInitialized) return;
    
    // Set backend to CPU if WebGL is not available
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        // Try to initialize WebGL backend
        await tf.setBackend('webgl');
        console.log('WebGL backend initialized');
      } else {
        // Server environment - use CPU
        await tf.setBackend('cpu');
        console.log('CPU backend initialized');
      }
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
      // Initialize backend first
      await this.initializeBackend();
      
      // Load the model
      this.model = await use.load({
        modelUrl: '/models/universal-sentence-encoder/model.json'
      });
      
      this.isLoaded = true;
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      
      // Try alternative loading method
      try {
        console.log('Trying alternative model loading...');
        this.model = await use.load();
        this.isLoaded = true;
        console.log('Model loaded successfully via alternative method');
      } catch (fallbackError) {
        console.error('Alternative loading also failed:', fallbackError);
        throw new Error(`Model loading failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Check if we're in browser environment
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

  // Get model status
  getModelStatus() {
    return {
      isLoaded: this.isLoaded,
      backendInitialized: this.backendInitialized,
      backend: tf.getBackend()
    };
  }
}

export const embeddingService = new EmbeddingService();