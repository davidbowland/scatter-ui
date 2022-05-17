import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Slider from '@mui/material/Slider'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import jsonpatch from 'fast-json-patch'

import { SessionData } from '@types'
import { updateSession } from '@services/sessions'

export interface OwnerProps {
  session: SessionData
  sessionId: string
  setSession: (value: SessionData) => void
}

const Owner = ({ session, sessionId, setSession }: OwnerProps): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionUrl, setSessionUrl] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
  const [workingSession, setWorkingSession] = useState(session)

  const copySessionUrl = (): void => {
    try {
      navigator.clipboard.writeText(sessionUrl)
      setSuccessMessage('Link copied to clipboard')
      setErrorMessage(undefined)
    } catch (error) {
      console.error('copyShortenedUrl', error)
      setErrorMessage('Could not copy link to clipboard')
    }
  }

  const patchSession = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const jsonPatchOperations = jsonpatch.compare(session, workingSession, true)
      const updatedSession = await updateSession(sessionId, jsonPatchOperations)
      setSession(updatedSession)
      setSuccessMessage('Game session updated successfully')
    } catch (error) {
      console.error('patchSession', error)
      setErrorMessage('Error updating game session')
    }
    setIsLoading(false)
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const snackbarSuccessClose = (): void => {
    setSuccessMessage(undefined)
  }

  useEffect((): void => {
    setSessionUrl(`${window.location.origin}/s/${sessionId}`)
  }, [sessionId])

  return (
    <div>
      <Stack margin="auto" maxWidth="400px" spacing={2}>
        <Divider />
        <label>
          <TextField
            aria-readonly="true"
            fullWidth
            label="Session URL"
            name="session-url"
            type="text"
            value={sessionUrl}
            variant="filled"
          />
        </label>
        <Button fullWidth onClick={copySessionUrl} variant="contained">
          Copy session URL
        </Button>
        <Divider />
        <label>
          Number of players: {workingSession.userCount}
          <Slider
            aria-label="Number of players"
            defaultValue={workingSession.userCount}
            disabled={isLoading}
            marks={true}
            max={5}
            min={2}
            onChange={(_: any, value: any) => setWorkingSession({ ...workingSession, userCount: value })}
            step={1}
            sx={{ paddingTop: '35px' }}
            valueLabelDisplay="auto"
          />
        </label>
        <Button
          data-amplify-analytics-name="update-session-click"
          data-amplify-analytics-on="click"
          disabled={isLoading}
          fullWidth
          onClick={patchSession}
          startIcon={isLoading ? <CircularProgress color="inherit" size={14} /> : null}
          variant="contained"
        >
          {isLoading ? 'Loading...' : 'Update game options'}
        </Button>
        <Snackbar autoHideDuration={15_000} onClose={snackbarErrorClose} open={errorMessage !== undefined}>
          <Alert onClose={snackbarErrorClose} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>
        <Snackbar autoHideDuration={5_000} onClose={snackbarSuccessClose} open={successMessage !== undefined}>
          <Alert onClose={snackbarSuccessClose} severity="success">
            {successMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </div>
  )
}

export default Owner
