import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ nickname: '', rating: 5, comment: '' });

  useEffect(() => {
    api.get(`/public/projects/${slug}`)
      .then(p => {
        setProject(p);
        return api.get(`/public/reviews/project/${p.id}`);
      })
      .then(setReviews)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/public/reviews/project/${project.id}`, reviewForm);
      setReviewForm({ nickname: '', rating: 5, comment: '' });
      const updated = await api.get(`/public/reviews/project/${project.id}`);
      setReviews(updated);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="px-6 py-20 text-gray-400">Loading...</div>;
  if (error) return <div className="px-6 py-20 text-red-400">{error}</div>;
  if (!project) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="px-6 py-12">
      <Link to="/portfolio" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">&larr; Back to Portfolio</Link>

      <h1 className="text-3xl font-bold text-white mb-4">{project.title}</h1>

      {project.techStack && (
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack.split(',').map(tech => (
            <span key={tech.trim()} className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">{tech.trim()}</span>
          ))}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
             className="px-4 py-2 text-sm border border-gray-700 hover:border-gray-500 text-gray-300 rounded transition-colors">GitHub</a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
             className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Live Demo</a>
        )}
      </div>

      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-12">
        {project.fullDescription}
      </div>

      {project.screenshots && project.screenshots.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.screenshots.map(ss => (
              <div key={ss.id}>
                <img src={ss.imageUrl} alt={ss.caption || ''} className="rounded border border-gray-800" />
                {ss.caption && <p className="text-sm text-gray-400 mt-1">{ss.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div className="border-t border-gray-800 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-white">Reviews</h2>
          {avgRating && (
            <span className="text-sm text-gray-400">
              {'★'.repeat(Math.round(parseFloat(avgRating)))}{'☆'.repeat(5 - Math.round(parseFloat(avgRating)))} {avgRating}/5 ({reviews.length})
            </span>
          )}
        </div>

        <form onSubmit={handleReviewSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex gap-3">
            <input type="text" placeholder="Nickname" value={reviewForm.nickname}
              onChange={e => setReviewForm(p => ({ ...p, nickname: e.target.value }))} required maxLength={50}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
            <select value={reviewForm.rating} onChange={e => setReviewForm(p => ({ ...p, rating: parseInt(e.target.value) }))}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm">
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} {n}/5</option>)}
            </select>
          </div>
          <textarea placeholder="Write a review..." value={reviewForm.comment}
            onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm" />
          <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">Submit Review</button>
        </form>

        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{review.nickname}</span>
                    <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {review.comment && <p className="text-gray-300 text-sm">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
