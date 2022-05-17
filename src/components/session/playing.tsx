import React, { useEffect, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { Categories, CategoriesObject, Decisions } from '@types'

export interface PlayingProps {
  categories: CategoriesObject
  decision: Decisions
  duration: number
  makeChoice: (category: string, value: Categories) => void
  setIsPlayingDone: (value: boolean) => void
}

const Playing = ({ categories, decision, duration, makeChoice, setIsPlayingDone }: PlayingProps): JSX.Element => {
  const contentsRef = useRef<HTMLDivElement>(null)
  const [category, setCategory] = useState('')
  const [endTime, setEndTime] = useState(new Date().getTime() + duration * 1_000)
  const [newDecisions, setNewDecisions] = useState<{ [key: number]: string }>({})
  const [seenCategories, setSeenCategories] = useState(Object.keys(decision.responses))
  const [timeoutRef, setTimeoutRef] = useState<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [timeRemaining, setTimeRemaining] = useState(duration)

  const advanceCategory = (): void => {
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      setTimeoutRef(undefined)
    }
    if (category) {
      makeChoice(category, newDecisions)
    }
    const nextCategory = Object.keys(categories).filter((cat) => seenCategories.indexOf(cat) < 0)[0]
    contentsRef.current && contentsRef.current.scrollIntoView()
    if (nextCategory === undefined) {
      setIsPlayingDone(true)
    } else {
      setTimeRemaining(duration)
      setEndTime(new Date().getTime() + duration * 1_000)

      setCategory(nextCategory)
      setNewDecisions({})
      setSeenCategories([...seenCategories, nextCategory])
    }
  }

  const getPrompts = (): JSX.Element[] => {
    if (!category) {
      return []
    }
    const currentCategoryPrompts = categories[category]
    return Array.from({ length: 10 }).map((_, idx) => (
      <label key={idx} style={{ width: '400px' }}>
        <TextField
          aria-readonly="true"
          autoComplete="postal-code"
          fullWidth
          key={idx}
          label={currentCategoryPrompts[idx + 1]}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            setNewDecisions({ ...newDecisions, [idx + 1]: event.target.value })
          }
          type="text"
          value={newDecisions[idx + 1] ?? ''}
          variant="filled"
        />
      </label>
    ))
  }

  const updateTimeRemaining = (): void => {
    setTimeRemaining(Math.floor((endTime - new Date().getTime()) / 1_000))
  }

  useEffect((): void => {
    if (timeRemaining > 0) {
      if (timeoutRef) {
        clearTimeout(timeoutRef)
      }
      setTimeoutRef(setTimeout(updateTimeRemaining, 1_000))
    } else {
      advanceCategory()
    }
  }, [timeRemaining])

  useEffect((): void => {
    advanceCategory()
    updateTimeRemaining()
  }, [])

  return (
    <Stack margin="auto" spacing={2}>
      <Typography ref={contentsRef} sx={{ textAlign: 'center' }} variant="h2">
        Letter: {category}
      </Typography>
      {getPrompts()}
      <Button fullWidth onClick={advanceCategory} variant="contained">
        Submit
      </Button>
      <Snackbar message={`${timeRemaining}s`} open={true} />
    </Stack>
  )
}

export default Playing
