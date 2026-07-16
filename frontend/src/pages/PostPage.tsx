import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import * as api from '../api'

export function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [post, setPost] = useState<api.Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPost = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPost(Number(id))
      setPost(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchPost()
  }, [id, isAuthenticated, navigate])

  const handleComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await api.createComment(Number(id), comment.trim())
      setComment('')
      await fetchPost()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    try {
      await api.deletePost(Number(id))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
      setDeleting(false)
    }
  }

  const isOwner = user?.id === post?.user_id

  if (loading) return <p className="page-center">Loading post...</p>
  if (error) return <div className="page-center"><p className="error-msg">{error}</p></div>
  if (!post) return <div className="page-center"><p className="error-msg">Post not found</p></div>

  return (
    <div className="post-detail">
      <Link to="/" className="back-link">&larr; Back to feed</Link>

      <article className="post-full">
        <div className="post-full-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>by {post.user?.username || `user #${post.user_id}`}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          {!isOwner && post.is_following !== undefined && (
            <button
              className={`follow-btn ${post.is_following ? 'following' : ''}`}
              onClick={async () => {
                try {
                  if (post.is_following) {
                    await api.unfollowUser(post.user_id)
                  } else {
                    await api.followUser(post.user_id)
                  }
                  setPost({ ...post, is_following: !post.is_following })
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to update follow status')
                }
              }}
            >
              {post.is_following ? 'Unfollow' : 'Follow'}
            </button>
          )}
          {post.tags?.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <p className="post-content">{post.content}</p>

        {isOwner && (
          <div className="post-actions">
            <Link to={`/posts/${post.id}/edit`} className="btn-secondary">Edit</Link>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </article>

      <section className="comments-section">
        <h2>Comments ({post.comments?.length ?? 0})</h2>

        {post.comments && post.comments.length > 0 ? (
          <ul className="comment-list">
            {post.comments.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment-meta">
                  <strong>{c.user?.username || `user #${c.user_id}`}</strong>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p>{c.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">No comments yet.</p>
        )}

        <form onSubmit={handleComment} className="comment-form">
          <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            required
            maxLength={1000}
          />
          <button type="submit" disabled={submitting || !comment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </section>
    </div>
  )
}
