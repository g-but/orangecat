const React = require('react')
const { useState, useEffect } = React

// Use the same mocked hooks the tests wire up
const { useAuth } = require('@/hooks/useAuth')
const { useSearchParams } = require('next/navigation')

function AuthPage() {
  const auth = useAuth()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const m = searchParams && searchParams.get ? searchParams.get('mode') : null
    if (m === 'login' || m === 'register') setMode(m)
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (mode === 'login') {
      if (auth && typeof auth.signIn === 'function') await auth.signIn(email, password)
    } else {
      if (auth && typeof auth.signUp === 'function') await auth.signUp(email, password)
    }
  }

  return (
    React.createElement('div', null,
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('label', { htmlFor: 'email' }, 'Email address'),
        React.createElement('input', { id: 'email', value: email, onChange: e => setEmail(e.target.value) }),
        mode !== 'forgot' && (
          React.createElement(React.Fragment, null,
            React.createElement('label', { htmlFor: 'password' }, 'Password'),
            React.createElement('input', { id: 'password', value: password, onChange: e => setPassword(e.target.value) })
          )
        ),
        mode === 'register' && (
          React.createElement(React.Fragment, null,
            React.createElement('label', { htmlFor: 'confirmPassword' }, 'Confirm Password'),
            React.createElement('input', { id: 'confirmPassword', value: confirmPassword, onChange: e => setConfirmPassword(e.target.value) })
          )
        ),
        React.createElement('button', { type: 'submit' }, mode === 'login' ? 'Sign in' : 'Create account')
      ),
      error && React.createElement('div', null, error),
      React.createElement('button', { type: 'button', onClick: () => setMode(mode === 'login' ? 'register' : 'login') }, mode === 'login' ? 'Create an account' : 'Sign in instead')
    )
  )
}

module.exports = AuthPage


