import NextAuth from 'next-auth'
import { AuthOptions } from '../../../lib/authOptions'


const handler = NextAuth(AuthOptions)

export { handler as GET, handler as POST }