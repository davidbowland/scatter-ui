import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { navigate } from 'gatsby'

import Logo from '@components/logo'

export interface WinnerProps {
  winners: string[]
}

const Winner = ({ winners }: WinnerProps): JSX.Element => {
  return (
    <>
      <Logo />
      <Stack margin="auto" maxWidth="400px" spacing={2}>
        <Card sx={{ margin: 'auto', maxWidth: 400 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography component="div" variant="h4">
                {winners.length === 1 ? 'The winner is:' : 'The winners are:'}
              </Typography>
              <Typography component="div" variant="h5">
                {winners.join(' & ')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
        <Button
          data-amplify-analytics-name="play-again-click"
          data-amplify-analytics-on="click"
          onClick={() => navigate('/')}
          variant="contained"
        >
          Play again
        </Button>
      </Stack>
    </>
  )
}

export default Winner
