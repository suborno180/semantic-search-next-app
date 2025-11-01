'use client';

import { useState, useEffect } from 'react';
import { embeddingService } from '@/lib/embedding';

interface SearchResult {
  document: {
    id: string;
    text: string;
    metadata: {
      createdAt: string;
      category?: string;
      length: number;
    };
  };
  similarity: number;
  processingTime: number;
}

export default function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  // Example queries for quick testing
  const exampleQueries = [
    "machine learning algorithms",
    "web development frameworks",
    "artificial intelligence",
    "programming languages",
    "neural networks",
    "data science methods"
  ];

  // Pre-load the model when component mounts
  useEffect(() => {
    const preloadModel = async () => {
      try {
        setModelStatus('loading');
        await embeddingService.loadModel();
        setModelStatus('ready');
      } catch (error) {
        console.error('Failed to pre-load model:', error);
        setModelStatus('idle');
      }
    };

    preloadModel();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setLoading(true);
    setSearchError(null);
    
    try {
      const startTime = performance.now();
      
      // Load model if not ready
      if (modelStatus !== 'ready') {
        console.log('Loading TensorFlow.js model...');
        setModelStatus('loading');
        await embeddingService.loadModel();
        setModelStatus('ready');
      }

      // Generate embedding on client side first
      console.log('Generating query embedding...');
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      console.log('Query embedding generated:', queryEmbedding.length, 'dimensions');

      // Then send to server for search
      const searchStartTime = performance.now();
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          queryEmbedding,
          limit: 10 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResults(data.results || []);
      setSearchTime(performance.now() - startTime);
      
      console.log('Search completed:', {
        results: data.results.length,
        time: performance.now() - startTime,
        query
      });

    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSearchError(`Search failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to highlight matching words in text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim() || text.length === 0) return text;
    
    const words = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    if (words.length === 0) return text;
    
    let highlighted = text;
    
    words.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '**$1**');
    });
    
    return highlighted.split('**').map((part, index) => 
      index % 2 === 1 ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Load example query
  const loadExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setSearchError(null);
  };

  // Clear results
  const clearResults = () => {
    setResults([]);
    setSearchTime(0);
    setSearchError(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 Semantic Search
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Search through your documents using AI-powered semantic understanding. 
          Finds meaning-based matches, not just keyword matches.
        </p>
      </div>

      {/* Error Display */}
      {searchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Search Error</p>
              <p className="text-red-600 text-sm">{searchError}</p>
            </div>
            <button
              onClick={() => setSearchError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search Input Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your semantic search query... (Try: 'machine learning', 'web development', 'artificial intelligence')"
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg pr-24"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title="Clear query"
              >
                ✕
              </button>
            )}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className={`w-3 h-3 rounded-full ${
                modelStatus === 'ready' ? 'bg-green-500' : 
                modelStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 
                'bg-gray-400'
              }`} title={
                modelStatus === 'ready' ? 'Model ready' : 
                modelStatus === 'loading' ? 'Loading model...' : 
                'Model not loaded'
              }></div>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold text-lg transition-colors flex items-center gap-2 min-w-32 justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <span>🔍</span>
                Search
              </>
            )}
          </button>
        </div>

        {/* Example Queries */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExampleQuery(example)}
                disabled={loading}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors disabled:opacity-50 border border-gray-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Model Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                modelStatus === 'ready' ? 'bg-green-500' : 
                modelStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 
                'bg-gray-400'
              }`}></div>
              {modelStatus === 'ready' ? 'Model Ready' : 
               modelStatus === 'loading' ? 'Loading Model...' : 
               'Model Not Loaded'}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Vector Search
            </span>
          </div>
          
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchTime > 0 && (
        <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-blue-800 font-semibold text-lg">
                📊 Found {results.length} results in {searchTime.toFixed(2)}ms
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Query: "{query}"
              </p>
            </div>
            <div className="bg-white px-3 py-2 rounded-lg border border-blue-200">
              <p className="text-blue-700 font-medium text-sm">
                Avg Similarity: {results.length > 0 ? 
                  ((results.reduce((sum, r) => sum + r.similarity, 0) / results.length) * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="space-y-6">
        {results.map((result, index) => (
          <div
            key={result.document.id}
            className="result-card p-6 rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          >
            {/* Result Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-full font-semibold text-sm shadow-sm">
                  #{index + 1}
                </span>
                <div>
                  <span className="text-lg font-semibold text-gray-800">
                    Match: <span className="text-green-600">{(result.similarity * 100).toFixed(2)}%</span>
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${result.similarity * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.similarity > 0.8 ? 'Excellent' : 
                       result.similarity > 0.6 ? 'Good' : 
                       result.similarity > 0.4 ? 'Fair' : 'Weak'} match
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 border">
                  <span>🏷️</span>
                  <span>{result.document.metadata.category || 'Uncategorized'}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(result.document.metadata.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            {/* Document Text */}
            <div className="text-content mb-4">
              <p className="text-gray-800 leading-relaxed text-base bg-gray-50 p-4 rounded-lg border">
                {highlightText(result.document.text, query)}
              </p>
            </div>
            
            {/* Footer Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-gray-500 border-t pt-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span>📝</span>
                  {result.document.metadata.length} characters
                </span>
                <span className="flex items-center gap-1">
                  <span>🔢</span>
                  ID: {result.document.id.slice(-8)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-medium">
                <span>⚡</span>
                Processed in {result.processingTime.toFixed(2)}ms
              </div>
            </div>
          </div>
        ))}
        
        {/* No Results State */}
        {results.length === 0 && searchTime > 0 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-3">No results found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              No documents matched your search query. Try different keywords or add more documents to your database.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setQuery('')}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Clear Search
              </button>
              <button
                onClick={() => {
                  const dataMonitor = document.getElementById('data-monitor');
                  if (dataMonitor) {
                    dataMonitor.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Documents
              </button>
            </div>
          </div>
        )}

        {/* Initial State */}
        {results.length === 0 && searchTime === 0 && (
          <div className="text-center py-20 bg-linear-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-7xl mb-6">🚀</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              Ready to Search
            </h3>
            <p className="text-gray-500 max-w-lg mx-auto text-lg mb-8">
              Enter a search query above to find semantically similar documents in your database.
              The AI will understand the meaning behind your words, not just match keywords.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-gray-800 mb-1">Semantic Search</h4>
                <p className="text-sm text-gray-600">Finds meaning-based matches</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-800 mb-1">Lightning Fast</h4>
                <p className="text-sm text-gray-600">Vector-based similarity search</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-semibold text-gray-800 mb-1">AI-Powered</h4>
                <p className="text-sm text-gray-600">TensorFlow.js embeddings</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {results.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Showing top {results.length} most relevant results • 
            Semantic search powered by Universal Sentence Encoder • 
            Built with Next.js & TensorFlow.js
          </p>
        </div>
      )}
    </div>
  );
}