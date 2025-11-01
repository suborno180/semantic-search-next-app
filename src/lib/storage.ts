import fs from 'fs';
import path from 'path';

export interface Document {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    createdAt: string;
    category?: string;
    length: number;
  };
}

export interface SearchResult {
  document: Document;
  similarity: number;
  processingTime: number;
}

class JSONStorage {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'documents.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  async addDocument(doc: Omit<Document, 'id'>): Promise<Document> {
    const documents = await this.getAllDocuments();
    const newDoc: Document = {
      ...doc,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    documents.push(newDoc);
    await this.saveDocuments(documents);
    return newDoc;
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveDocuments(documents: Document[]) {
    fs.writeFileSync(this.filePath, JSON.stringify(documents, null, 2));
  }

  async getStats() {
    const documents = await this.getAllDocuments();
    const totalDocs = documents.length;
    
    return {
      totalDocuments: totalDocs,
      totalVectors: totalDocs,
      averageTextLength: totalDocs > 0 
        ? documents.reduce((sum, doc) => sum + doc.text.length, 0) / totalDocs 
        : 0,
      categories: [...new Set(documents.map(doc => doc.metadata.category).filter(Boolean))]
    };
  }
}

export const storage = new JSONStorage();