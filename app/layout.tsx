import './globals.css'
import { Inter } from 'next/font/google'
import NavBar from './components/navbar'
import { Box } from '@mui/material'
import AuthProvider from './lib/authProvider'
import Footer from './components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'The Struggle Planner',
  description: "Plan how poor you'll be",
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Box 
        display={'flex'} 
        flexDirection={'column'} 
        sx={{
          height: { xs: '100%', lg: '100vh' },
        }}>
          <AuthProvider>
            <NavBar />
            
            <main style={{ flex: 1, }}>
                {children}
            </main>
          </AuthProvider>

          <Footer />
        </Box>
      </body>
    </html>
  )
}
