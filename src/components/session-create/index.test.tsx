import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import * as sessionService from '@services/sessions'
import { sessionId, user } from '@test/__mocks__'
import Logo from '@components/logo'
import SessionCreate from './index'
import SignUpCta from '@components/sign-up-cta'

jest.mock('aws-amplify')
jest.mock('@aws-amplify/analytics')
jest.mock('@components/logo')
jest.mock('@components/sign-up-cta')
jest.mock('gatsby')
jest.mock('@services/sessions')

describe('SessionCreate component', () => {
  const consoleError = console.error
  const navigatorGeolocation = navigator.geolocation

  const getCurrentPosition = jest.fn()
  const setAuthState = jest.fn()
  const setShowLogin = jest.fn()

  beforeAll(() => {
    console.error = jest.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success: any) => {
          const result = getCurrentPosition()
          if (result) {
            success(result)
          }
        },
      },
    })
    mocked(Logo).mockReturnValue(<></>)
    mocked(SignUpCta).mockReturnValue(<></>)
  })

  afterAll(() => {
    console.error = consoleError
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: navigatorGeolocation,
    })
  })

  describe('signed out', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockRejectedValue(undefined)
    })

    test('expect SignUpCta rendered', () => {
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)
      expect(mocked(SignUpCta)).toHaveBeenCalledTimes(1)
    })
  })

  describe('signed in', () => {
    const otherVoterPhone = '+18005551111'

    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
      mocked(sessionService).createSession.mockResolvedValue({ sessionId })
    })

    test('expect createSession called with new Session', async () => {
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const roundsSliderInput = (await screen.findByLabelText(/Number of game rounds/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(roundsSliderInput, { target: { value: 5 } })
      })
      const timeSliderInput = (await screen.findByLabelText(/Round time limit/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(timeSliderInput, { target: { value: 30 } })
      })
      const playersSliderInput = (await screen.findByLabelText(/Number of players/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(playersSliderInput, { target: { value: 4 } })
      })
      const textUpdateCheckbox = (await screen.findByLabelText(/Send text message updates/i)) as HTMLInputElement
      await act(async () => {
        textUpdateCheckbox.click()
      })
      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })

      expect(mocked(sessionService).createSession).toHaveBeenCalledWith({
        rounds: 5,
        textUpdates: false,
        timeLimit: 30,
        userCount: 4,
      })
    })

    test('expect success message removed when closed', async () => {
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const roundsSliderInput = (await screen.findByLabelText(/Number of game rounds/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(roundsSliderInput, { target: { value: 5 } })
      })
      const timeSliderInput = (await screen.findByLabelText(/Round time limit/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(timeSliderInput, { target: { value: 30 } })
      })
      const playersSliderInput = (await screen.findByLabelText(/Number of players/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(playersSliderInput, { target: { value: 4 } })
      })
      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        closeSnackbarButton.click()
      })

      expect(await screen.queryByText(/Scatter game starting/i)).not.toBeInTheDocument()
    })

    test('expect error when invalid phone number entered', async () => {
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const roundsSliderInput = (await screen.findByLabelText(/Number of game rounds/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(roundsSliderInput, { target: { value: 5 } })
      })
      const timeSliderInput = (await screen.findByLabelText(/Round time limit/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(timeSliderInput, { target: { value: 30 } })
      })
      const playersSliderInput = (await screen.findByLabelText(/Number of players/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(playersSliderInput, { target: { value: 4 } })
      })
      const voterPhoneInput = (await screen.findByLabelText(/Player #2 phone number/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(voterPhoneInput, { target: { value: '+12345' } })
      })
      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })

      expect(await screen.findByText(/Invalid phone number/i)).toBeInTheDocument()
    })

    test('expect textSession called when voter phone entered', async () => {
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const roundsSliderInput = (await screen.findByLabelText(/Number of game rounds/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(roundsSliderInput, { target: { value: 5 } })
      })
      const timeSliderInput = (await screen.findByLabelText(/Round time limit/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(timeSliderInput, { target: { value: 30 } })
      })
      const playersSliderInput = (await screen.findByLabelText(/Number of players/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(playersSliderInput, { target: { value: 4 } })
      })
      const voterPhoneInput = (await screen.findByLabelText(/Player #2 phone number/i)) as HTMLInputElement
      await act(async () => {
        fireEvent.change(voterPhoneInput, { target: { value: otherVoterPhone } })
      })
      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })

      expect(mocked(sessionService).textSession).toHaveBeenCalledWith(sessionId, otherVoterPhone)
    })

    test('expect error message on createSession error', async () => {
      mocked(sessionService).createSession.mockRejectedValueOnce(undefined)
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })

      expect(screen.queryByText(/Please try again/i)).toBeInTheDocument()
    })

    test('expect closing error message removes it', async () => {
      mocked(sessionService).createSession.mockRejectedValueOnce(undefined)
      render(<SessionCreate setAuthState={setAuthState} setShowLogin={setShowLogin} />)

      const playButton = (await screen.findByText(/Start game/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        playButton.click()
      })
      const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
      await act(async () => {
        closeSnackbarButton.click()
      })

      await expect(screen.queryByText(/Please try again/i)).not.toBeInTheDocument()
    })
  })
})
