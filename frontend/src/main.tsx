import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import App from './App'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FeedPage } from './pages/FeedPage'
import { PostPage } from './pages/PostPage'
import { PostFormPage } from './pages/PostFormPage'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'confirm/:token', element: <ConfirmationPage /> },
      { path: 'posts/new', element: <PostFormPage /> },
      { path: 'posts/:id', element: <PostPage /> },
      { path: 'posts/:id/edit', element: <PostFormPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
