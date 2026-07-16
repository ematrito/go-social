const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1'
const TOKEN_KEY = 'gophersocial_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

function jwtPayload(token: string): { sub?: string } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function userIdFromToken(): number | null {
  const token = getToken()
  if (!token) return null
  const p = jwtPayload(token)
  return p?.sub ? Number(p.sub) : null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  })

  if (res.status === 204) return undefined as T

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json.data as T
}

export interface User {
  id: number
  username: string
  email: string
  created_at: string
  is_active: boolean
}

export interface UserWithToken extends User {
  token: string
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  user: { id: number; username: string }
}

export interface Post {
  id: number
  title: string
  content: string
  tags: string[]
  user_id: number
  created_at: string
  updated_at: string
  version: number
  comments?: Comment[]
  comment_count?: number
  is_following?: boolean
  user: { id: number; username: string }
}

export interface FeedQuery {
  limit?: number
  offset?: number
  sort?: 'asc' | 'desc'
  tags?: string
  search?: string
  since?: string
  until?: string
}

export function login(email: string, password: string): Promise<string> {
  return request('/authentication/token', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(username: string, email: string, password: string): Promise<UserWithToken> {
  return request('/authentication/user', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function activateUser(token: string): Promise<void> {
  return request(`/users/activate/${token}`, { method: 'PUT' })
}

export function getUser(id: number): Promise<User> {
  return request(`/users/${id}`)
}

export function followUser(id: number): Promise<void> {
  return request(`/users/${id}/follow`, { method: 'PUT' })
}

export function unfollowUser(id: number): Promise<void> {
  return request(`/users/${id}/unfollow`, { method: 'PUT' })
}

export function getFeed(query: FeedQuery = {}): Promise<Post[]> {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', String(query.limit))
  if (query.offset) params.set('offset', String(query.offset))
  if (query.sort) params.set('sort', query.sort)
  if (query.tags) params.set('tags', query.tags)
  if (query.search) params.set('search', query.search)
  if (query.since) params.set('since', query.since)
  if (query.until) params.set('until', query.until)
  const qs = params.toString()
  return request(`/users/feed${qs ? `?${qs}` : ''}`)
}

export function getPost(id: number): Promise<Post> {
  return request(`/posts/${id}`)
}

export function createPost(title: string, content: string, tags: string[]): Promise<Post> {
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content, tags }),
  })
}

export function updatePost(id: number, title: string, content: string): Promise<Post> {
  return request(`/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, content }),
  })
}

export function deletePost(id: number): Promise<void> {
  return request(`/posts/${id}`, { method: 'DELETE' })
}

export function createComment(postId: number, content: string): Promise<Comment> {
  return request(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
