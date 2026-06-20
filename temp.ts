import { createAuthClient } from 'better-auth/client'

const client = createAuthClient()

type SessionType = typeof client.useSession