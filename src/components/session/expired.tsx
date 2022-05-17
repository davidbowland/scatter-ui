import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { navigate } from 'gatsby'

import Logo from '@components/logo'

const Expired = (): JSX.Element => {
  return (
    <>
      <Logo />
      <Stack margin="auto" maxWidth="400px" spacing={2}>
        <Alert severity="error">Game session expired</Alert>
        <Typography sx={{ textAlign: 'center' }} variant="h6">
          The Scatter game you are trying to access is missing or has expired.
        </Typography>
        <Button
          data-amplify-analytics-name="new-game-click"
          data-amplify-analytics-on="click"
          fullWidth
          onClick={() => navigate('/')}
          variant="contained"
        >
          Start new game
        </Button>
      </Stack>
    </>
  )
}

export default Expired
