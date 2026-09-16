import { Container, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { SearchOff as SearchOffIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { PageHeader, EmptyState } from './components/HudPrimitives'
import PageTransition from './components/PageTransition'

export default function NotFound() {
  return (
    <PageTransition>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <PageHeader
          icon={<SearchOffIcon sx={{ fontSize: '1rem', color: '#14B8A6' }} />}
          title="Page Not Found"
          subtitle="404 — this route is not part of the app"
        />

        <EmptyState message="The address you followed does not match any screen here.">
          <Button
            component={Link}
            to="/"
            variant="contained"
            size="small"
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem !important' }} />}
            sx={{ fontSize: '0.8rem', bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0f9a87' } }}
          >
            Back to Dashboard
          </Button>
        </EmptyState>
      </Container>
    </PageTransition>
  )
}
