import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function HomePage() {
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    api.get('/public/posts?page=0&size=3')
      .then(data => setRecentPosts(data.content || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="py-20 px-6">
        <h1 className="text-4xl font-bold text-white mb-4">
          Hello, I'm Juhyeon
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Backend developer building things with Java, Spring Boot, and systems programming.
          Currently studying at Hive Helsinki.
        </p>
        <div className="flex gap-4 mt-8">
          <Link to="/portfolio" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
            Portfolio
          </Link>
          <Link to="/resume" className="px-4 py-2 border border-gray-700 hover:border-gray-500 text-gray-300 rounded transition-colors">
            Resume
          </Link>
        </div>
      </section>

      <section className="px-6 py-12 border-t border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Journal</h2>
          <Link to="/journal" className="text-sm text-gray-400 hover:text-white transition-colors">View all &rarr;</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {recentPosts.map(post => (
              <Link key={post.id} to={`/journal/${post.slug}`} className="block group">
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                {post.excerpt && <p className="text-gray-400 text-sm mt-1">{post.excerpt}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
