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
  const calculatePointsFromValue = (
    phoneNumber: string,
    letter: string,
    categoryIndex: string
  ): { displayValue: string; pointValue: number } => {
    const displayValue = decisions[phoneNumber].responses[letter][categoryIndex]?.toUpperCase()
    const otherValues = Object.keys(decisions)
      .filter((phoneNumber) => phoneNumber === userPhoneNumber)
      .map((phoneNumber) => decisions[phoneNumber].responses[letter][categoryIndex]?.toUpperCase())

    if (displayValue === undefined || phoneNumber === userPhoneNumber || otherValues.indexOf(displayValue) >= 0) {
      return { displayValue, pointValue: 0 }
    }
    const splitDisplayValue = displayValue.split(/\s+/)
    if (splitDisplayValue[0].startsWith(letter)) {
      return { displayValue, pointValue: splitDisplayValue.filter((word) => word.startsWith(letter)).length }
    }
    return { displayValue, pointValue: 0 }
  }

  const compilePoints = (): CategoryPointsObject => {
    const newPoints: CategoryPointsObject = {}
    for (const phoneNumber of Object.keys(decisions)) {
      newPoints[phoneNumber] = {}
      for (const letter of Object.keys(categories)) {
        newPoints[phoneNumber][letter] = {}
        for (const categoryIndex of Object.keys(categories[letter])) {
          const { pointValue } = calculatePointsFromValue(phoneNumber, letter, categoryIndex)
          newPoints[phoneNumber][letter][categoryIndex] = pointValue
        }
      }
    }
    return newPoints
  }

  const generateTableBody = (letter: string, categoryIndex: string): JSX.Element[] => {
    return Object.keys(decisions).map(
      (phoneNumber: string): JSX.Element => {
        const { displayValue, pointValue } = calculatePointsFromValue(phoneNumber, letter, categoryIndex)
        return (
          <TableRow hover key={phoneNumber} role="checkbox">
            <TableCell>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={phoneNumber !== userPhoneNumber && pointValue > 0}
                    disabled={phoneNumber === userPhoneNumber}
                    onClick={(event: any): void => {
                      const itemPoints = event.target.checked ? pointValue : 0
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
        <Typography>
          Uncheck the box next to any responses that are invalid. Responses with the same first letter multiple times
          are worth multiple points while duplicate responses are worth zero points.
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
