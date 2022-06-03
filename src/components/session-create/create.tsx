import React, { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { navigate } from 'gatsby'

import { createSession, textSession } from '@services/sessions'
import Logo from '@components/logo'
import { NewSession } from '@types'

interface UserIds {
  [key: number]: string | undefined
}

const Create = (): JSX.Element => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [userIdErrors, setUserIdErrors] = useState<UserIds>({})
  const [roundCount, setRoundCount] = useState(3)
  const [sendTextUpdates, setSendTextUpdates] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
  const [timeLimit, setTimeLimit] = useState(75)
  const [userCount, setUserCount] = useState(2)
  const [voterIds, setVoterIds] = useState<UserIds>({})

  const generateSession = async (): Promise<void> => {
    const errors = Array.from({ length: userCount - 1 }).reduce((agg: any, _, index: any) => {
      if (voterIds[index]?.match(/^\+1[2-9]\d{9}$/) === null && voterIds[index] !== '') {
        agg[index] = 'Invalid phone number. Be sure to include area code.'
      }
      return agg
    }, {}) as UserIds
    setUserIdErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsLoading(true)
    try {
      const newSession: NewSession = {
        rounds: roundCount,
        textUpdates: sendTextUpdates,
        timeLimit,
        userCount,
      }
      const session = await createSession(newSession)
      setErrorMessage(undefined)
      setSuccessMessage('Scatter game starting')

      await Promise.all(
        Array.from({ length: userCount - 1 }).map((_, index: any) => {
          const phoneNumber = voterIds[index]
          if (phoneNumber) {
            textSession(session.sessionId, phoneNumber)
          }
        })
      )

      navigate(`/s/${session.sessionId}`)
    } catch (error: any) {
      console.error('generateSession', error)
      setErrorMessage('Error generating Scatter game. Please try again later.')
      setIsLoading(false)
    }
  }

  const onPlayerIdChange = (index: number, value: string): void => {
    const sanitizedPhone = value.replace(/\D/g, '')
    const phoneWithCountry = sanitizedPhone.replace(/^\+?1?([2-9]\d+)/, '+1$1')
    const trimmedPhone = phoneWithCountry.substring(0, 12)
    setVoterIds({ ...voterIds, [index]: trimmedPhone })
  }

  const snackbarErrorClose = (): void => {
    setErrorMessage(undefined)
  }

  const snackbarSuccessClose = (): void => {
    setSuccessMessage(undefined)
  }

  return (
    <>
      <Logo />
      <Stack margin="auto" maxWidth="400px" spacing={2}>
        <label>
          Number of rounds: {roundCount}
          <Slider
            aria-label="Number of game rounds"
            defaultValue={roundCount}
            disabled={isLoading}
            marks={true}
            max={5}
            min={1}
            onChange={(_: any, value: any) => setRoundCount(value)}
            step={1}
            sx={{ paddingTop: '35px' }}
            valueLabelDisplay="auto"
          />
        </label>
        <label>
          Round time limit: {timeLimit} seconds
          <Slider
            aria-label="Round time limit"
            defaultValue={timeLimit}
            disabled={isLoading}
            marks={true}
            max={300}
            min={30}
            onChange={(_: any, value: any) => setTimeLimit(value)}
            step={15}
            sx={{ paddingTop: '35px' }}
            valueLabelDisplay="auto"
          />
        </label>
        <label>
          Number of players: {userCount}
          <Slider
            aria-label="Number of players"
            defaultValue={userCount}
            disabled={isLoading}
            marks={true}
            max={5}
            min={2}
            onChange={(_: any, value: any) => setUserCount(value)}
            step={1}
            sx={{ paddingTop: '35px' }}
            valueLabelDisplay="auto"
          />
        </label>
        <FormControlLabel
          control={
            <Checkbox checked={sendTextUpdates} onClick={(event: any) => setSendTextUpdates(event.target.checked)} />
          }
          disabled={isLoading}
          label="Send text message updates"
        />
        {userCount > 1 && (
          <Alert severity="info">
            You must distribute the game link to players. Enter the phone number of other players to text them the link!
          </Alert>
        )}
        {Array.from({ length: userCount - 1 }).map((_, index) => (
          <label key={index}>
            <TextField
              aria-readonly="true"
              disabled={isLoading}
              error={userIdErrors[index] !== undefined}
              fullWidth
              helperText={userIdErrors[index]}
              key={index}
              label={`Player #${index + 2} phone number (optional)`}
              name="phone_number"
              onChange={(event) => onPlayerIdChange(index, event.target.value)}
              placeholder="+10000000000"
              type="tel"
              value={voterIds[index]}
              variant="filled"
            />
          </label>
        ))}
        <Button
          data-amplify-analytics-name="generate-session-click"
          data-amplify-analytics-on="click"
          disabled={isLoading}
          fullWidth
          onClick={generateSession}
          startIcon={isLoading ? <CircularProgress color="inherit" size={14} /> : null}
          variant="contained"
        >
          {isLoading ? 'Loading...' : 'Start game'}
        </Button>
        <Typography style={{ textAlign: 'center' }}>Game sessions automatically expire after five days</Typography>
      </Stack>
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
    </>
  )
}

export default Create
