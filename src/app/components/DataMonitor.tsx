'use client';

import { useState, useEffect } from 'react';
import { embeddingService } from '@/lib/embedding';

interface Stats {
  totalDocuments: number;
  totalVectors: number;
  averageTextLength: number;
  categories: string[];
}

export default function DataMonitor() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [newText, setNewText] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const addDocument = async () => {
    if (!newText.trim()) {
      showMessage('error', 'Please enter some text');
      return;
    }

    setLoading(true);
    try {
      // Generate embedding on client side
      console.log('Generating embedding...');
      const embedding = await embeddingService.generateEmbedding(newText);
      console.log('Embedding generated:', embedding.length, 'dimensions');

      // Send to server with embedding
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: newText, 
          category,
          embedding 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add document');
      }

      console.log('Document added successfully:', data);
      showMessage('success', 'Document added successfully!');
      setNewText('');
      setCategory('');
      fetchStats();
    } catch (error) {
      console.error('Failed to add document:', error);
      showMessage('error', `Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Example data presets
  const exampleData = [
    {
      text: "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed.",
      category: "AI"
    },
    {
      text: "React is a JavaScript library for building user interfaces, particularly web applications that can update data without reloading the page.",
      category: "Programming"
    },
    {
      text: "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
      category: "Programming"
    }
  ];

  const loadExample = (example: { text: string; category: string }) => {
    setNewText(example.text);
    setCategory(example.category);
  };

  if (!stats) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Data Management & Monitoring</h2>
      
      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Vectors</h3>
          <p className="text-2xl font-bold text-green-600">{stats.totalVectors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Avg Text Length</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.averageTextLength.toFixed(0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Categories</h3>
          <p className="text-2xl font-bold text-orange-600">
            {stats.categories.length}
          </p>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">💡 Quick Examples:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {exampleData.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(example)}
              className="text-left p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors hover:border-blue-300"
            >
              <span className="font-medium text-blue-700 block mb-1">
                Example {index + 1}
              </span>
              <span className="text-sm text-gray-600 block truncate">
                {example.text.substring(0, 60)}...
              </span>
              <span className="text-xs text-blue-600 mt-1 block">
                Category: {example.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add New Document */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Document</h3>
        <div className="space-y-4">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter text to vectorize and store..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          <button
            onClick={addDocument}
            disabled={loading || !newText.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : (
              'Add Document & Generate Vector'
            )}
          </button>
        </div>
      </div>

      {/* Real-time Updates */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          ⚡ Auto-updating every 5 seconds • Last update: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}