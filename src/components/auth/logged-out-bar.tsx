import Button from '@mui/material/Button'
import { Link } from 'gatsby'
import LoginIcon from '@mui/icons-material/Login'
import React from 'react'
import Typography from '@mui/material/Typography'

import { AuthState } from '@types'

export interface LoggedOutBarProps {
  setAuthState: (state: AuthState) => void
  setShowLogin: (state: boolean) => void
}

const LoggedOutBar = ({ setAuthState, setShowLogin }: LoggedOutBarProps): JSX.Element => {
  const signInClick = () => {
    setAuthState('signIn')
    setShowLogin(true)
  }

  return (
    <>
      <Typography sx={{ flexGrow: 1 }} variant="h6">
        <Link style={{ color: '#fff', textDecoration: 'none' }} to="/">
          Scatter
        </Link>
      </Typography>
      <Button
        onClick={signInClick}
        startIcon={<LoginIcon />}
        sx={{ borderColor: '#fff', color: '#fff' }}
        variant="outlined"
      >
        Sign In
      </Button>
    </>
  )
}

export default LoggedOutBar
