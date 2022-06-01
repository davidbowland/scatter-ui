import '@aws-amplify/ui-react/styles.css'
import React, { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import { Auth } from 'aws-amplify'
import Toolbar from '@mui/material/Toolbar'

import { AuthState, CognitoUserAmplify } from '@types'
import LoggedInBar from './logged-in-bar'
import LoggedOutBar from './logged-out-bar'
import ScatterAuthenticator from './scatter-authenticator'

export interface AuthenticatedProps {
  children: JSX.Element | JSX.Element[]
  initialAuthState: AuthState
  initialShowLogin: boolean
  setInitialAuthState?: (value: AuthState) => void
  setInitialShowLogin?: (value: boolean) => void
}

const Authenticated = ({
  children,
  initialAuthState,
  initialShowLogin,
  setInitialAuthState,
  setInitialShowLogin,
}: AuthenticatedProps): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState)
  const [loggedInUser, setLoggedInUser] = useState<CognitoUserAmplify | undefined>(undefined)
  const [showLogin, setShowLogin] = useState(initialShowLogin)

  useEffect(() => {
    setAuthState(initialAuthState)
  }, [initialAuthState])

  useEffect(() => {
    if (setInitialAuthState !== undefined) {
      setInitialAuthState(authState)
    }
  }, [authState])

  useEffect(() => {
    setShowLogin(initialShowLogin)
  }, [initialShowLogin])

  useEffect(() => {
    if (setInitialShowLogin !== undefined) {
      setInitialShowLogin(showLogin)
    }
  }, [showLogin])

  useEffect(() => {
    setShowLogin(false)
  }, [loggedInUser])

  // Set user if already logged in
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {loggedInUser ? (
            <LoggedInBar loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />
          ) : (
            <LoggedOutBar setAuthState={setAuthState} setShowLogin={setShowLogin} />
          )}
        </Toolbar>
      </AppBar>
      {showLogin && !loggedInUser ? (
        <ScatterAuthenticator authState={authState} setLoggedInUser={setLoggedInUser} setShowLogin={setShowLogin} />
      ) : (
        children
      )}
    </>
  )
}

export default Authenticated
