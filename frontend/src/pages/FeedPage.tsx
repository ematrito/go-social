import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import * as api from '../api'

export function FeedPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<api.Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')

  const fetchFeed = async (searchQuery?: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getFeed({ search: searchQuery, sort, limit: 20 })
      setPosts(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchFeed()
  }, [isAuthenticated, navigate, sort])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    fetchFeed(search)
  }

  const handleFollow = async (postId: number, targetUserId: number, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) {
        await api.unfollowUser(targetUserId)
      } else {
        await api.followUser(targetUserId)
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_following: !currentlyFollowing } : p,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status')
    }
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1>Feed</h1>
        <div className="feed-controls">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <p>Loading feed...</p>
      ) : posts.length === 0 ? (
        <p className="empty-msg">No posts yet. Follow some users or <Link to="/posts/new">create a post</Link>.</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card-wrapper">
              <Link to={`/posts/${post.id}`} className="post-card">
                <h2>{post.title}</h2>
                <div className="post-meta">
                  <span>by {post.user?.username || `user #${post.user_id}`}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.comment_count !== undefined && (
                    <span>{post.comment_count} comments</span>
                  )}
                </div>
                {post.tags?.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
              {user && user.id !== post.user_id && post.is_following !== undefined && (
                <button
                  className={`follow-btn ${post.is_following ? 'following' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleFollow(post.id, post.user_id, post.is_following!)
                  }}
                >
                  {post.is_following ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
