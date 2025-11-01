'use client';

import { useState } from 'react';
import { embeddingService } from '@/lib/embedding';

export default function VectorVisualization() {
  const [text, setText] = useState('');
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmbedding = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const embeddingResult = await embeddingService.generateEmbedding(text);
      setEmbedding(embeddingResult);
    } catch (err) {
      console.error('Embedding generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate embedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Vector Visualization</h2>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to see its vector representation..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg"
          onKeyPress={(e) => e.key === 'Enter' && generateEmbedding()}
        />
        <button
          onClick={generateEmbedding}
          disabled={loading || !text.trim()}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold text-lg transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Generating...
            </span>
          ) : (
            'Vectorize'
          )}
        </button>
      </div>

      {embedding.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Vector Dimensions: {embedding.length}
          </h3>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Original Text:</strong> "{text}"
            </p>
            <p className="text-sm text-gray-500">
              This text has been converted to a {embedding.length}-dimensional vector.
              Each dimension represents a feature learned by the AI model.
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {embedding.slice(0, 128).map((value, index) => (
                <div
                  key={index}
                  className="text-xs p-1 text-center border rounded hover:scale-105 transition-transform cursor-help"
                  style={{
                    backgroundColor: `rgba(147, 51, 234, ${Math.abs(value) * 2})`,
                    color: Math.abs(value) > 0.25 ? 'white' : 'black',
                    borderColor: `rgba(147, 51, 234, ${Math.abs(value) * 0.5})`
                  }}
                  title={`Dimension ${index + 1}: ${value.toFixed(6)}`}
                >
                  {value.toFixed(2)}
                </div>
              ))}
              {embedding.length > 128 && (
                <div className="col-span-8 text-center py-4 text-gray-500 bg-gray-100 rounded">
                  ... and {embedding.length - 128} more dimensions
                  <br />
                  <span className="text-sm">(showing first 128 dimensions for clarity)</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Vector Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-blue-600 font-semibold">Min Value</div>
              <div className="text-blue-800">{Math.min(...embedding).toFixed(4)}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-green-600 font-semibold">Max Value</div>
              <div className="text-green-800">{Math.max(...embedding).toFixed(4)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-purple-600 font-semibold">Average</div>
              <div className="text-purple-800">{(embedding.reduce((a, b) => a + b, 0) / embedding.length).toFixed(4)}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="text-orange-600 font-semibold">Magnitude</div>
              <div className="text-orange-800">{Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      {embedding.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">How Vector Embeddings Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
            <div>
              <h4 className="font-semibold mb-2">🔤 Text to Numbers</h4>
              <p>Your text is converted into a 512-dimensional vector where each dimension represents a semantic feature.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Semantic Meaning</h4>
              <p>Similar texts have similar vector representations, enabling semantic search beyond keyword matching.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Dimensionality</h4>
              <p>512 dimensions capture complex relationships between words and phrases in the text.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ Universal Encoder</h4>
              <p>Uses Google's Universal Sentence Encoder model trained on massive text data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}