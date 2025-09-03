import { useAppStore } from '../store/useAppStore'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Link,
  Chip
} from '@mui/material'
import { 
  SwapHoriz as TransferIcon,
  CheckCircle as ApprovalIcon,
  Add as MintIcon
} from '@mui/icons-material'

export default function EventsTable(){
   const events = useAppStore(s=>s.events) || []
  const reversedEvents = events.slice().reverse()

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transfer':
        return <TransferIcon fontSize="small" />
      case 'approval':
        return <ApprovalIcon fontSize="small" />
      case 'mint':
        return <MintIcon fontSize="small" />
      default:
        return undefined
    }
  }

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transfer':
        return 'success'
      case 'approval':
        return 'warning'
      case 'mint':
        return 'info'
      default:
        return 'default'
    }
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        maxHeight: 400,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 }
            }}>
              Type
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 }
            }}>
              Token
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 }
            }}>
              Amount
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 },
              display: { xs: 'none', md: 'table-cell' }
            }}>
              From
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 },
              display: { xs: 'none', md: 'table-cell' }
            }}>
              To
            </TableCell>
            <TableCell sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: 1, sm: 2 }
            }}>
              Tx
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reversedEvents.map((e,i)=>(
            <TableRow key={i} hover>
              <TableCell sx={{ padding: { xs: 1, sm: 2 } }}>
                <Chip
                  icon={getEventIcon(e.type)}
                  label={e.type}
                  color={getEventColor(e.type) as 'success' | 'warning' | 'info' | 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              </TableCell>
              <TableCell sx={{ padding: { xs: 1, sm: 2 } }}>
                <Chip 
                  label={e.token} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              </TableCell>
              <TableCell sx={{ 
                padding: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500
              }}>
                {e.amount}
              </TableCell>
              <TableCell sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                padding: { xs: 1, sm: 2 },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                {e.from ? `${e.from.slice(0, 6)}...${e.from.slice(-4)}` : '-'}
              </TableCell>
              <TableCell sx={{ 
                fontFamily: 'monospace', 
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                padding: { xs: 1, sm: 2 },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                {e.to ? `${e.to.slice(0, 6)}...${e.to.slice(-4)}` : '-'}
              </TableCell>
              <TableCell sx={{ padding: { xs: 1, sm: 2 } }}>
                <Link
                  href={`https://sepolia.etherscan.io/tx/${e.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {e.tx.slice(0,10)}...
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
