import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { CategoriesObject, CategoryPointsObject, Decisions } from '@types'
import Logo from '@components/logo'

export interface PointingProps {
  categories: CategoriesObject
  decisions: { [key: string]: Decisions }
  makeChoice: (value: CategoryPointsObject) => void
  setIsPointingDone: (value: boolean) => void
  userPhoneNumber: string
}

const Pointing = ({
  categories,
  decisions,
  makeChoice,
  setIsPointingDone,
  userPhoneNumber,
}: PointingProps): JSX.Element => {
  const calculatePointsFromValue = (displayValue: string | undefined, letter: string): number => {
    if (displayValue === undefined) {
      return 0
    }
    const splitDisplayValue = displayValue.split(/\s+/)
    if (splitDisplayValue[0].startsWith(letter)) {
      return splitDisplayValue.filter((word) => word.startsWith(letter)).length
    }
    return 0
  }

  const compilePoints = (): CategoryPointsObject => {
    const newPoints: CategoryPointsObject = {}
    for (const phoneNumber of Object.keys(decisions)) {
      newPoints[phoneNumber] = {}
      for (const letter of Object.keys(categories)) {
        newPoints[phoneNumber][letter] = {}
        for (const categoryIndex of Object.keys(categories[letter])) {
          const displayValue = decisions[phoneNumber].responses[letter][categoryIndex]?.toUpperCase()
          newPoints[phoneNumber][letter][categoryIndex] =
            phoneNumber === userPhoneNumber ? 0 : calculatePointsFromValue(displayValue, letter)
        }
      }
    }
    return newPoints
  }

  const generateTableBody = (letter: string, categoryIndex: string): JSX.Element[] => {
    return Object.keys(decisions).map(
      (phoneNumber: string): JSX.Element => {
        const displayValue = decisions[phoneNumber].responses[letter][categoryIndex]?.toUpperCase()
        const pointValue = calculatePointsFromValue(displayValue, letter)
        return (
          <TableRow hover key={phoneNumber} role="checkbox">
            <TableCell>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={phoneNumber !== userPhoneNumber && pointValue > 0}
                    disabled={phoneNumber === userPhoneNumber}
                    onClick={(event: any): void => {
                      const itemPoints = event.target.checked ? calculatePointsFromValue(displayValue, letter) : 0
                      setPoints({
                        ...points,
                        [phoneNumber]: {
                          ...points[phoneNumber],
                          [letter]: {
                            ...points[phoneNumber][letter],
                            [categoryIndex]: itemPoints,
                          },
                        },
                      })
                    }}
                  />
                }
                label={`${pointValue} - ${displayValue ?? '[None]'}`}
              />
            </TableCell>
          </TableRow>
        )
      }
    )
  }

  const [points, setPoints] = useState(compilePoints())

  return (
    <>
      <Logo />
      <Stack margin="auto" maxWidth="400px" spacing={2}>
        <Typography sx={{ textAlign: 'center' }} variant="h6">
          Choose which responses merit points
        </Typography>
        {Object.keys(categories).map((letter: string) =>
          Object.keys(categories[letter]).map((categoryIndex: string) => (
            <TableContainer key={`${letter}-${categoryIndex}`} sx={{ maxHeight: 440 }}>
              <Table aria-label="sticky table" stickyHeader>
                <TableHead>
                  <TableRow>
                    {letter} - {categories[letter][categoryIndex]}
                  </TableRow>
                </TableHead>
                <TableBody>{generateTableBody(letter, categoryIndex)}</TableBody>
              </Table>
            </TableContainer>
          ))
        )}
        <Button
          fullWidth
          onClick={() => {
            makeChoice(points)
            setIsPointingDone(true)
          }}
          variant="contained"
        >
          Submit
        </Button>
      </Stack>
    </>
  )
}

export default Pointing
