import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import * as api from '../api'

export function PostFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isEdit) {
      setFetching(true)
      api.getPost(Number(id))
        .then((post) => {
          setTitle(post.title)
          setContent(post.content)
          setTags(post.tags?.join(', ') ?? '')
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load post'))
        .finally(() => setFetching(false))
    }
  }, [id, isEdit, isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      if (isEdit) {
        await api.updatePost(Number(id), title.trim(), content.trim())
      } else {
        await api.createPost(title.trim(), content.trim(), tagList)
      }
      navigate(isEdit ? `/posts/${id}` : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post')
      setLoading(false)
    }
  }

  if (fetching) return <p className="page-center">Loading post...</p>

  return (
    <div className="form-page">
      <h1>{isEdit ? 'Edit Post' : 'New Post'}</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
          maxLength={1000}
        />
        {!isEdit && (
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        )}
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create Post'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
