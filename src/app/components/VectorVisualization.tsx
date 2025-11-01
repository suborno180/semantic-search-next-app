'use client';

import { useState } from 'react';

export default function VectorVisualization() {
    const [text, setText] = useState('');
    const [embedding, setEmbedding] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const generateEmbedding = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/embed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            setEmbedding(data.embedding);
        } catch (error) {
            console.error('Embedding generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Vector Visualization</h2>

            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to see its vector representation..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                    onClick={generateEmbedding}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? 'Generating...' : 'Vectorize'}
                </button>
            </div>

            {embedding.length > 0 && (
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">
                        Vector Dimensions: {embedding.length}
                    </h3>
                    <div className="max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-8 gap-1">
                            {embedding.slice(0, 100).map((value, index) => (
                                <div
                                    key={index}
                                    className="text-xs p-1 text-center border rounded"
                                    style={{
                                        backgroundColor: `rgba(147, 51, 234, ${Math.abs(value)})`,
                                        color: Math.abs(value) > 0.5 ? 'white' : 'black'
                                    }}
                                    title={`Dimension ${index + 1}: ${value.toFixed(4)}`}
                                >
                                    {value.toFixed(2)}
                                </div>
                            ))}
                            {embedding.length > 100 && (
                                <div className="col-span-8 text-center py-2 text-gray-500">
                                    ... and {embedding.length - 100} more dimensions
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}