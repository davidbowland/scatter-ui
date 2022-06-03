import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import { Auth } from 'aws-amplify'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import jsonpatch from 'fast-json-patch'

import { AuthState, Categories, CategoryPointsObject, CognitoUserAmplify, Decisions, SessionData } from '@types'
import { fetchDecision, fetchSession, updateDecisions } from '@services/sessions'
import Expired from './expired'
import LoginPrompt from './login-prompt'
import Logo from '@components/logo'
import Owner from './owner'
import Playing from './playing'
import Pointing from './pointing'
import Winner from './winner'

const MAX_STATUS_REFRESH_COUNT = 50
const delayBetweenRefreshMs = parseInt(process.env.GATSBY_DELAY_BETWEEN_REFRESH_MS, 10)

export interface SessionProps {
  initialUserId?: string
  maxStatusRefreshCount?: number
  sessionId: string
  setAuthState: (value: AuthState) => void
  setShowLogin: (value: boolean) => void
}

const Session = ({
  initialUserId,
  maxStatusRefreshCount = MAX_STATUS_REFRESH_COUNT,
  sessionId,
  setAuthState,
  setShowLogin,
}: SessionProps): JSX.Element => {
  const [decision, setDecision] = useState<Decisions>({ points: {}, responses: {} })
  const [decisionInitial, setDecisionInitial] = useState<Decisions>({ points: {}, responses: {} })
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlayingDone, setIsPlayingDone] = useState(false)
  const [isPointingDone, setIsPointingDone] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<CognitoUserAmplify | undefined>(undefined)
  const [session, setSession] = useState<SessionData>({ status: 'playing' } as any)
  const [statusCount, setStatusCount] = useState(0)

  const makeCategoryDecision = (category: string, value: Categories): void => {
    setDecision({ ...decision, responses: { ...decision.responses, [category]: value } })
  }

  const makePointsDecision = (value: CategoryPointsObject): void => {
    setDecision({ ...decision, points: { ...decision.points, ...value } })
  }

  const refreshDecisions = async (): Promise<void> => {
    if (loggedInUser) {
      const jsonPatchOperations = jsonpatch.compare(decisionInitial, decision, true)
      if (jsonPatchOperations.length > 0) {
        try {
          await updateDecisions(sessionId, loggedInUser!.attributes!.phone_number, jsonPatchOperations)
          setDecisionInitial(decision)
        } catch (error) {
          console.error('refreshDecisions', error)
          setErrorMessage('Error saving categories. Please reload the page and try again.')
        }
      } else {
        try {
          const currentDecision = await fetchDecision(sessionId, loggedInUser!.attributes!.phone_number)
          if (jsonpatch.compare(currentDecision, decisionInitial).length > 0) {
            setDecision(currentDecision)
            setDecisionInitial(currentDecision)
          }
        } catch (error) {
          console.error('refreshDecisions', error)
          setErrorMessage('Error fetching categories. Please reload the page and try again.')
        }
      }
    }
  }

  const refreshStatus = async (): Promise<void> => {
    if (isLoading) {
      return
    }
    setIsLoading(true)

    try {
      const currentSession = await fetchSession(sessionId)
      setSession(currentSession)
      if (
        (currentSession.status === 'playing' && isPlayingDone) ||
        (currentSession.status === 'pointing' && isPointingDone)
      ) {
        setIsWaiting(true)
        if (statusCount < maxStatusRefreshCount) {
          setStatusCount(statusCount + 1)
          setTimeout(refreshStatus, delayBetweenRefreshMs)
        }
        return
      }
    } catch (error) {
      console.error('refreshStatus', error)
      setSession({ ...session, status: 'expired' } as any)
    }
    setIsLoading(false)
  }

  const renderSession = (): JSX.Element => {
    if (errorMessage) {
      return (
        <>
          <Logo />
          <Alert severity="error">{errorMessage}</Alert>
        </>
      )
    } else if (session?.status === 'expired') {
      return <Expired />
    } else if (loggedInUser === undefined) {
      return (
        <LoginPrompt
          initialUserId={initialUserId}
          setAuthState={setAuthState}
          setLoggedInUser={setLoggedInUser}
          setShowLogin={setShowLogin}
        />
      )
    } else if (session?.status === 'playing') {
      return session.categories && !isPlayingDone ? (
        <Stack spacing={2} sx={{ marginBottom: '2em' }}>
          <Playing
            categories={session.categories}
            decision={decision}
            duration={session.timeLimit}
            makeChoice={makeCategoryDecision}
            setIsPlayingDone={setIsPlayingDone}
          />
          {session.owner === loggedInUser?.attributes?.sub && (
            <Owner session={session} sessionId={sessionId} setSession={setSession} />
          )}
        </Stack>
      ) : (
        <></>
      )
    } else if (session?.status === 'pointing') {
      return (
        <Pointing
          categories={session.categories}
          decisions={session.decisions}
          makeChoice={makePointsDecision}
          setIsPointingDone={setIsPointingDone}
          userPhoneNumber={loggedInUser!.attributes!.phone_number}
        />
      )
    } else if (session?.status === 'winner' && session.winners) {
      return <Winner winners={session.winners} />
    } else {
      return (
        <>
          <Logo />
          <Typography color="#fff" variant="h6">
            An error has occurred
          </Typography>
        </>
      )
    }
  }

  useEffect(() => {
    refreshStatus()
  }, [isPlayingDone, isPointingDone])

  useEffect(() => {
    refreshDecisions()
  }, [decision, loggedInUser])

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  return (
    <>
      {renderSession()}
      <Backdrop
        open={isLoading}
        sx={{ color: '#fff', textAlign: 'center', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}
      >
        <Stack margin="auto" maxWidth="400px" spacing={2}>
          {isWaiting ? (
            <>
              <Typography color="#fff" variant="h5">
                Entry complete
              </Typography>
              <Typography color="#fff" variant="h5">
                {statusCount < maxStatusRefreshCount ? 'Waiting for other players' : 'Please refresh the page'}
              </Typography>
            </>
          ) : (
            <Typography color="#fff" variant="h5">
              Loading
            </Typography>
          )}
          <div style={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" />
          </div>
          {isWaiting && (
            <div>
              <Typography color="#fff" variant="h6">
                If other players aren&apos;t actively playing, you can bookmark this page and come back later.
              </Typography>
            </div>
          )}
        </Stack>
      </Backdrop>
    </>
  )
}

export default Session
