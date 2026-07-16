import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div id="app">
      <nav>
        <Link to="/" className="nav-brand">GopherSocial</Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.username}</span>
              <Link to="/posts/new">+ New Post</Link>
              <button onClick={() => { logout(); navigate('/login') }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
