import type { auth } from '@praxor-kit/auth'

export type AppVariables = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
}
