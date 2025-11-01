import SearchInterface from './components/SearchInterface';
import DataMonitor from './components/DataMonitor';
import VectorVisualization from './components/VectorVisualization';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Semantic Search Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with Next.js, TensorFlow.js, and Local JSON Database.
            Real-time vector search with full transparency.
          </p>
        </header>

        <div className="space-y-12">
          {/* Add ID for smooth scrolling from SearchInterface */}
          <div id="data-monitor">
            <DataMonitor />
          </div>
          <VectorVisualization />
          <SearchInterface />
        </div>

        <footer className="mt-16 text-center text-gray-500">
          <p>
            Built for learning • All processing happens locally in your browser
          </p>
        </footer>
      </div>
    </main>
  );
}