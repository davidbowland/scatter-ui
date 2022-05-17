import '@testing-library/jest-dom'
import * as gatsby from 'gatsby'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import * as sessionService from '@services/sessions'
import { decisions, session, sessionId, user, userId } from '@test/__mocks__'
import GameSession from './index'
import Logo from '@components/logo'

jest.mock('aws-amplify')
jest.mock('@aws-amplify/analytics')
jest.mock('@components/logo')
jest.mock('gatsby')
jest.mock('@services/sessions')

describe('Session component', () => {
  const consoleError = console.error
  const mockCopyToClipboard = jest.fn()
  const mockSetAuthState = jest.fn()
  const mockSetShowLogin = jest.fn()

  beforeAll(() => {
    console.error = jest.fn()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockCopyToClipboard },
    })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://dbowland.com' },
    })

    mocked(Logo).mockReturnValue(<>Logo</>)
    mocked(sessionService).fetchDecision.mockResolvedValue(decisions)
    mocked(sessionService).fetchSession.mockResolvedValue(session)
  })

  afterAll(() => {
    console.error = consoleError
  })

  describe('signed out', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockRejectedValue(undefined)
    })

    describe('expired session', () => {
      test('expect expired message when session expired', async () => {
        mocked(sessionService).fetchSession.mockRejectedValueOnce(undefined)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/Session expired/i)).toBeInTheDocument()
      })

      test('expect start new game navigates', async () => {
        mocked(sessionService).fetchSession.mockRejectedValueOnce(undefined)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const newChoicesButton = (await screen.findByText(/Start new game/i)) as HTMLButtonElement
        await act(async () => {
          newChoicesButton.click()
        })

        expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/')
      })
    })

    describe('userId log in', () => {
      test('expect initialUserId sets userId text box', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const userIdInput = (await screen.findByLabelText(/Your phone number/i)) as HTMLInputElement
        expect(userIdInput.value)
      })

      test('expect invalid userId shows value', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const userIdInput = (await screen.findByLabelText(/Your phone number/i)) as HTMLInputElement
        await act(async () => {
          fireEvent.change(userIdInput, { target: { value: '+1555' } })
        })
        const chooseButton = (await screen.findByText(/Let's play!/i, { selector: 'button' })) as HTMLButtonElement
        await act(async () => {
          chooseButton.click()
        })

        expect(await screen.findByText(/Invalid phone number. Be sure to include area code./i)).toBeInTheDocument()
      })

      test('expect valid userId logs in', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const userIdInput = (await screen.findByLabelText(/Your phone number/i)) as HTMLInputElement
        await act(async () => {
          fireEvent.change(userIdInput, { target: { value: userId } })
        })
        const chooseButton = (await screen.findByText(/Let's play!/i, { selector: 'button' })) as HTMLButtonElement
        await act(async () => {
          chooseButton.click()
        })

        expect(await screen.findByText(/Letter: K/i)).toBeInTheDocument()
        expect(await screen.findByText(/Types of Drink/i)).toBeInTheDocument()
        expect(mocked(sessionService).fetchDecision).toHaveBeenCalledWith('aeio', '+15551234567')
      })
    })

    describe('sign in', () => {
      test('expect clicking sign in invokes Authenticator', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const chooseButton = (await screen.findByText(/Sign in/i, { selector: 'button' })) as HTMLButtonElement
        await act(async () => {
          chooseButton.click()
        })

        expect(mockSetAuthState).toHaveBeenCalledWith('signIn')
        expect(mockSetShowLogin).toHaveBeenCalledWith(true)
      })
    })

    describe('sign up', () => {
      test('expect clicking sign up invokes Authenticator', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const chooseButton = (await screen.findByText(/Sign up/i, { selector: 'button' })) as HTMLButtonElement
        await act(async () => {
          chooseButton.click()
        })

        expect(mockSetAuthState).toHaveBeenCalledWith('signUp')
        expect(mockSetShowLogin).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('signed in', () => {
    beforeAll(() => {
      mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    })

    describe('playing', () => {
      test('expect first prompt shown when signed in', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/Letter: K/i)).toBeInTheDocument()
        expect(await screen.findByText(/Things in the Sky/i)).toBeInTheDocument()
        expect(mocked(sessionService).fetchDecision).toHaveBeenCalledWith('aeio', '+15551234567')
      })

      test('expect second prompt shown when submit clicked', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const submitButton = (await screen.findByText(/Submit/i)) as HTMLButtonElement
        await act(async () => {
          submitButton.click()
        })

        expect(await screen.findByText(/Letter: I/i)).toBeInTheDocument()
        expect(await screen.findByText(/Historical Figures/i)).toBeInTheDocument()
      })

      test('expect second prompt shown when time expires', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({ ...session, timeLimit: 1 })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/Letter: I/i)).toBeInTheDocument()
        expect(await screen.findByText(/Historical Figures/i)).toBeInTheDocument()
      })

      test('expect pointing done when submit clicked', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          categories: {
            K: {
              '1': 'Types of Drink',
            },
          },
          rounds: 1,
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const submitButton = (await screen.findByText(/Submit/i)) as HTMLButtonElement
        await act(async () => {
          submitButton.click()
        })

        expect(screen.queryByText(/Letter: K/i)).not.toBeInTheDocument()
      })

      test('expect game results passed to PATCH endpoint', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const itemInput = (await screen.findByLabelText(/Things You Shout/i)) as HTMLInputElement
        await act(async () => {
          fireEvent.change(itemInput, { target: { value: 'Kool' } })
        })
        const submitButton = (await screen.findByText(/Submit/i)) as HTMLButtonElement
        await act(async () => {
          submitButton.click()
        })

        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith('aeio', '+15551234567', expect.anything())
        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith('aeio', '+15551234567', [
          {
            op: 'add',
            path: '/responses/K',
            value: {
              '5': 'Kool',
            },
          },
        ])
      })
    })

    describe('pointing', () => {
      test('expect points passed to PATCH endpoint', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          status: 'pointing',
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const checkboxInput = (await screen.findByLabelText(/1 - Nunk/i)) as HTMLInputElement
        await act(async () => {
          checkboxInput.click()
        })
        const submitButton = (await screen.findByText(/Submit/i)) as HTMLButtonElement
        await act(async () => {
          submitButton.click()
        })

        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith('aeio', '+15551234567', expect.anything())
        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith('aeio', '+15551234567', [
          {
            op: 'test',
            path: '/points/+15551234567/V',
            value: {
              '1': 0,
              '10': 0,
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
              '6': 0,
              '7': 0,
              '8': 0,
              '9': 0,
            },
          },
          {
            op: 'remove',
            path: '/points/+15551234567/V',
          },
          {
            op: 'test',
            path: '/points/+15551234567/I/10',
            value: 1,
          },
          {
            op: 'replace',
            path: '/points/+15551234567/I/10',
            value: 0,
          },
          {
            op: 'test',
            path: '/points/+15551234567/I/7',
            value: 1,
          },
          {
            op: 'replace',
            path: '/points/+15551234567/I/7',
            value: 0,
          },
          {
            op: 'add',
            path: '/points/+15551234567/K',
            value: {
              '1': 0,
              '10': 0,
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
              '6': 0,
              '7': 0,
              '8': 0,
              '9': 0,
            },
          },
          {
            op: 'add',
            path: '/points/+15551234567/N',
            value: {
              '1': 0,
              '10': 0,
              '2': 0,
              '3': 0,
              '4': 0,
              '5': 0,
              '6': 0,
              '7': 0,
              '8': 0,
              '9': 0,
            },
          },
          {
            op: 'add',
            path: '/points/+15551234568',
            value: {
              I: {
                '1': 0,
                '10': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 0,
              },
              K: {
                '1': 0,
                '10': 1,
                '2': 1,
                '3': 1,
                '4': 0,
                '5': 2,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 0,
              },
              N: {
                '1': 0,
                '10': 1,
                '2': 1,
                '3': 0,
                '4': 0,
                '5': 1,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 1,
              },
            },
          },
        ])
      })

      test('expect double-clicking checkbox puts points back', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          status: 'pointing',
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const checkboxInput = (await screen.findByLabelText(/1 - Nunk/i)) as HTMLInputElement
        await act(async () => {
          checkboxInput.click()
        })
        await act(async () => {
          checkboxInput.click()
        })
        const submitButton = (await screen.findByText(/Submit/i)) as HTMLButtonElement
        await act(async () => {
          submitButton.click()
        })

        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith('aeio', '+15551234567', expect.anything())
        expect(mocked(sessionService).updateDecisions).toHaveBeenCalledWith(
          'aeio',
          '+15551234567',
          expect.arrayContaining([
            {
              op: 'add',
              path: '/points/+15551234568',
              value: {
                I: {
                  '1': 0,
                  '10': 0,
                  '2': 0,
                  '3': 0,
                  '4': 0,
                  '5': 0,
                  '6': 0,
                  '7': 0,
                  '8': 0,
                  '9': 0,
                },
                K: {
                  '1': 0,
                  '10': 1,
                  '2': 1,
                  '3': 1,
                  '4': 0,
                  '5': 2,
                  '6': 0,
                  '7': 0,
                  '8': 0,
                  '9': 0,
                },
                N: {
                  '1': 1,
                  '10': 1,
                  '2': 1,
                  '3': 0,
                  '4': 0,
                  '5': 1,
                  '6': 0,
                  '7': 0,
                  '8': 0,
                  '9': 1,
                },
              },
            },
          ])
        )
      })
    })

    describe('owner', () => {
      test('expect correct URL shown when logged in', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const urlInput: HTMLInputElement = (await screen.findByLabelText(/Session URL/i)) as HTMLInputElement
        await waitFor(() => {
          expect(urlInput.value).toEqual('https://dbowland.com/s/aeio')
        })
      })

      test('expect owner section not shown to non-owner', async () => {
        mocked(Auth).currentAuthenticatedUser.mockResolvedValueOnce({ ...user, attributes: { sub: 'another-user' } })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(screen.queryByLabelText(/Session URL/i)).not.toBeInTheDocument()
      })

      test('expect copy invokes writeText and displays message', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const copyLinkButton = (await screen.findByText(/Copy session URL/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          copyLinkButton.click()
        })

        expect(mockCopyToClipboard).toHaveBeenCalled()
        expect(await screen.findByText(/Link copied to clipboard/i)).toBeInTheDocument()
      })

      test('expect closing copy success message removes it', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const copyLinkButton = (await screen.findByText(/Copy session URL/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          copyLinkButton.click()
        })
        const closeSnackbarButton = (await screen.findByLabelText(/Close/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          closeSnackbarButton.click()
        })

        expect(screen.queryByText(/Link copied to clipboard/i)).not.toBeInTheDocument()
      })

      test('expect copy throw displays error', async () => {
        mockCopyToClipboard.mockImplementationOnce(() => {
          throw new Error('A wild error appeared')
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const copyLinkButton = (await screen.findByText(/Copy session URL/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          copyLinkButton.click()
        })

        expect(mockCopyToClipboard).toHaveBeenCalled()
        expect(await screen.findByText(/Could not copy link to clipboard/i)).toBeInTheDocument()
      })

      test('expect closing error message removes it', async () => {
        mockCopyToClipboard.mockImplementationOnce(() => {
          throw new Error('A wild error appeared')
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const copyLinkButton = (await screen.findByText(/Copy session URL/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          copyLinkButton.click()
        })
        const closeSnackbarButton = (await screen.findByLabelText(/Close/i, {
          selector: 'button',
        })) as HTMLButtonElement
        act(() => {
          closeSnackbarButton.click()
        })

        expect(screen.queryByText(/Could not copy link to clipboard/i)).not.toBeInTheDocument()
      })

      test('expect updateSession invoked with patched Session', async () => {
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const playerSliderInput = (await screen.findByLabelText(/Number of players/i)) as HTMLInputElement
        await act(async () => {
          fireEvent.change(playerSliderInput, { target: { value: 4 } })
        })
        const updateButton = (await screen.findByText(/Update game options/i, {
          selector: 'button',
        })) as HTMLButtonElement
        await act(async () => {
          updateButton.click()
        })

        expect(mocked(sessionService).updateSession).toHaveBeenCalledWith(sessionId, [
          {
            op: 'test',
            path: '/userCount',
            value: 2,
          },
          {
            op: 'replace',
            path: '/userCount',
            value: 4,
          },
        ])
      })

      test('expect error message when updateSession rejects', async () => {
        mocked(sessionService).updateSession.mockRejectedValueOnce(undefined)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const updateButton = (await screen.findByText(/Update game options/i, {
          selector: 'button',
        })) as HTMLButtonElement
        await act(async () => {
          updateButton.click()
        })

        expect(await screen.findByText(/Error updating game session/i)).toBeInTheDocument()
      })
    })

    describe('winner', () => {
      test('expect winner message when winner selected', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          status: 'winner',
          winners: ['+15552223333'],
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/The winner is:/i)).toBeInTheDocument()
        expect(await screen.findByText(/15552223333/i)).toBeInTheDocument()
      })

      test('expect play again navigates', async () => {
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          status: 'winner',
          winners: ['+15552223333'],
        })
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        const playAgainButton = (await screen.findByText(/Play again/i)) as HTMLButtonElement
        await act(async () => {
          playAgainButton.click()
        })

        expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/')
      })
    })

    describe('service errors', () => {
      test('expect error message on bad status', async () => {
        mocked(Auth).currentAuthenticatedUser.mockResolvedValueOnce(user)
        mocked(sessionService).fetchSession.mockResolvedValueOnce({
          ...session,
          status: 'bad_status',
        } as any)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/An error has occurred/i)).toBeInTheDocument()
      })

      test('expect error message on fetchDecisions reject', async () => {
        mocked(Auth).currentAuthenticatedUser.mockResolvedValueOnce(user)
        mocked(sessionService).fetchDecision.mockRejectedValueOnce(undefined)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/Error fetching categories/i)).toBeInTheDocument()
      })

      test('expect error message on updateDecisions reject', async () => {
        mocked(Auth).currentAuthenticatedUser.mockResolvedValueOnce(user)
        mocked(sessionService).updateDecisions.mockRejectedValueOnce(undefined)
        render(<GameSession sessionId={sessionId} setAuthState={mockSetAuthState} setShowLogin={mockSetShowLogin} />)

        expect(await screen.findByText(/Error saving categories/i)).toBeInTheDocument()
      })
    })
  })
})
