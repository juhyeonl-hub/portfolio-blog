import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { api } from '../services/api';

export default function PostDetailPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/public/posts/${slug}`)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;
  if (!post) return <div className="px-6 py-20 text-red-400">Post not found</div>;

  const hasKorean = Boolean(post.titleKo && post.contentKo);
  const requestedLang = searchParams.get('lang') === 'ko' ? 'ko' : 'en';
  const lang = requestedLang === 'ko' && hasKorean ? 'ko' : 'en';

  const title = lang === 'ko' ? post.titleKo : post.title;
  const content = lang === 'ko' ? post.contentKo : post.content;

  const setLang = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'en') {
      params.delete('lang');
    } else {
      params.set('lang', 'ko');
    }
    setSearchParams(params, { replace: true });
  };

  const dateLocale = lang === 'ko' ? 'ko-KR' : 'en-US';

  return (
    <div className="px-6 py-12 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <Link to="/journal" className="text-sm text-gray-400 hover:text-white">&larr; Back to Journal</Link>
        {hasKorean && (
          <div className="text-sm select-none" aria-label="Language">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}
            >EN</button>
            <span className="mx-2 text-gray-600">|</span>
            <button
              type="button"
              onClick={() => setLang('ko')}
              className={lang === 'ko' ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}
            >KR</button>
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {new Date(post.createdAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {post.tags.map(t => (
            <span key={t.id} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">{t.name}</span>
          ))}
        </div>
      )}

      <article className="prose prose-invert prose-sm max-w-none
        prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400
        prose-code:text-gray-200 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
        prose-strong:text-white prose-li:text-gray-300
        prose-blockquote:border-gray-700 prose-blockquote:text-gray-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
