import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const InternalServerError = (): JSX.Element => {
  return (
    <Authenticated initialAuthState="signIn" initialShowLogin={false}>
      <ServerErrorMessage title="500: Internal Server Error">
        An internal server error has occurred trying to serve your request. If you continue to experience this error,
        please contact the webmaster.
      </ServerErrorMessage>
    </Authenticated>
  )
}

export default InternalServerError
