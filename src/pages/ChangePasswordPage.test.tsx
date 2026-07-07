import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ChangePasswordPage from './ChangePasswordPage'

vi.mock('@/api/auth', () => ({
  authApi: { changePassword: vi.fn(() => Promise.resolve({ success: true, message: 'ok', data: undefined })) },
}))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/change-password']}>
        <Routes>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/login" element={<div>Login Page Marker</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ChangePasswordPage — agents cannot self-service their password', () => {
  it('an AGENT sees the "can\'t change password here" message, not the form', () => {
    useAuthStore.getState().login({
      token: 't', refreshToken: 'rt', userId: 'agent-1', name: 'Agent One', email: 'a@test.com', role: 'AGENT',
    })

    renderPage()

    expect(screen.getByText("Can't Change Password Here")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('At least 8 characters')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /update password/i })).not.toBeInTheDocument()
  })

  it('an AGENT can still sign out from the blocked screen', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().login({
      token: 't', refreshToken: 'rt', userId: 'agent-1', name: 'Agent One', email: 'a@test.com', role: 'AGENT',
    })

    renderPage()
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByText('Login Page Marker')).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('an ADMIN sees the normal change-password form', () => {
    useAuthStore.getState().login({
      token: 't', refreshToken: 'rt', userId: 'admin-1', name: 'Admin One', email: 'admin@test.com', role: 'ADMIN',
    })

    renderPage()

    expect(screen.queryByText("Can't Change Password Here")).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })
})
