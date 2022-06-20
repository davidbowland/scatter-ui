import { Authenticator, ThemeProvider, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import Button from '@mui/material/Button'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import React from 'react'
import Stack from '@mui/material/Stack'

import { AuthState, CognitoUserAmplify } from '@types'
import Logo from '@components/logo'

export interface ScatterAuthenticatorProps {
  authState: AuthState
  setLoggedInUser: (user: CognitoUserAmplify | undefined) => void
  setShowLogin: (state: boolean) => void
}

const ScatterAuthenticator = ({ authState, setLoggedInUser, setShowLogin }: ScatterAuthenticatorProps): JSX.Element => {
  const theme = {
    name: 'dark-mode-theme',
    overrides: [defaultDarkModeOverride],
  }

  return (
    <section style={{ padding: '50px' }}>
      <ThemeProvider colorMode="system" theme={theme}>
        <Logo />
        <Stack margin="auto" spacing={2}>
          <Authenticator initialState={authState} loginMechanisms={['phone_number']} signUpAttributes={['name']}>
            {({ user }) => {
              setLoggedInUser(user)
              return <></>
            }}
          </Authenticator>
          <div style={{ textAlign: 'center' }}>
            <Button onClick={() => setShowLogin(false)} startIcon={<CancelOutlinedIcon />} variant="outlined">
              Cancel
            </Button>
          </div>
        </Stack>
      </ThemeProvider>
    </section>
  )
}

export default ScatterAuthenticator
