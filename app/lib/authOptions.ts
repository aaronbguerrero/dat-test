import { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import Email from 'next-auth/providers/email'
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google'
import clientPromise from '../lib/database'
import { ObjectId } from 'mongodb'


export const AuthOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(
    clientPromise, 
    { 
      collections: { Accounts: 'linkedUserAccounts' }, 
      databaseName: 'userData',
    },
  ),
  callbacks: {
    jwt: async ({ token, trigger, session }) => {
      let property = ''
      if (session) {
        property = Object.keys(session)[0]

        if (trigger === 'update' && property !== '' && session[property] && token[property]) {
          token[property] = session[property]
        }
      }

      return token
    },
    session: async ({ session, token, trigger, newSession }) => {
      if (session?.user) {
        if (token.sub) {
          const client = await clientPromise
          const db  = client.db("userData")
  
          const userData = await db.collection('users').findOne({ _id: new ObjectId(token.sub) })
  
          session.user.id = token.sub
          session.user.currencyUsed = userData?.currencyUsed || "USD"
          session.user.name = userData?.name
        }
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials}) {
      return true
    }
  },
  pages: {
    newUser: '/register',
    //TODO: Delete this page?
    // signIn: '/signin',
    verifyRequest: '/verify',
  },
  providers: [
    Email({
      server: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // profile(profile: GoogleProfile): any {
      //   return {
      //     id: profile.id.toString(),
      //     name: profile.name,
      //     email: profile.email,
      //     image: profile.picture,
      //     currencyUsed: "JPY",
      //   }
      // }
    })
  ],
  session: {
    strategy: 'jwt',
  },
}