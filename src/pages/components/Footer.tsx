import { Box, Container, Typography, Link, Chip } from '@mui/material'
import { GitHub as GitHubIcon, Bolt as BoltIcon } from '@mui/icons-material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 6,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#0a0a0a',
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoltIcon sx={{ fontSize: '1.2rem', color: '#06b6d4' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Onchain
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              — Built by{' '}
              <Link
                href="https://github.com/fcreme"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontWeight: 600 }}
              >
                fcreme
              </Link>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['React', 'TypeScript', 'Wagmi', 'Viem', 'MUI'].map(tech => (
              <Chip
                key={tech}
                label={tech}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.65rem',
                  height: 22,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'text.secondary'
                }}
              />
            ))}
          </Box>

          <Link
            href="https://github.com/fcreme/tokenflow"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              fontSize: '0.875rem',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <GitHubIcon sx={{ fontSize: '1.1rem' }} />
            Source Code
          </Link>
        </Box>
      </Container>
    </Box>
  )
}
