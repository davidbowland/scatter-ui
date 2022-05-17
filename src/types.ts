export { CognitoUserAmplify } from '@aws-amplify/ui'
export { Operation as PatchOperation } from 'fast-json-patch'
export { Theme } from '@mui/material/styles'

export type AuthState = 'signIn' | 'signUp' | 'resetPassword'

export interface Categories {
  [key: string]: string
}

export interface CategoriesObject {
  [key: string]: Categories
}

export interface CategoryPoints {
  [key: string]: {
    [key: string]: number
  }
}

export interface CategoryPointsObject {
  [key: string]: CategoryPoints
}

export interface Decisions {
  points: CategoryPointsObject
  responses: CategoriesObject
}

export interface NewSession {
  expiration?: number
  rounds: number
  timeLimit: number
  userCount: number
}

export interface SessionData extends NewSession {
  categories: CategoriesObject
  decisions: { [key: string]: Decisions }
  expiration: number
  owner: string
  status: 'playing' | 'pointing' | 'winner' | 'expired'
  winners?: string[]
}

export interface StringObject {
  [key: string]: string
}
