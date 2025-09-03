# 🧪 Guía de Testnet - Web3 Challenge

## ¿Qué es Testnet?

Testnet es una red de prueba que simula la blockchain de Ethereum pero sin usar dinero real. Es perfecta para:

- ✅ Probar funcionalidades sin riesgo
- ✅ Aprender sobre DeFi de forma segura
- ✅ Desarrollar y debuggear aplicaciones
- ✅ Experimentar con tokens y contratos

## 🚀 Cómo activar el modo Testnet

### 1. Configuración automática
La aplicación ya está configurada para usar **Sepolia Testnet** por defecto.

### 2. Variables de entorno (opcional)
Crea un archivo `.env` en la raíz del proyecto:

```env
# WalletConnect Project ID (opcional)
VITE_WALLETCONNECT_PROJECT_ID=demo

# Sepolia RPC URL (opcional - usa el público por defecto)
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Direcciones de contratos (ya configuradas)
VITE_DAI_CONTRACT_ADDRESS=0x1D70D57ccD2798323232B2dD027B3aBcA5C00091
VITE_USDC_CONTRACT_ADDRESS=0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47
```

## 💰 Obtener ETH de prueba

Para usar la aplicación necesitas ETH de prueba (no real):

### Faucets recomendados:
1. **Sepolia Faucet oficial**: https://sepoliafaucet.com/
2. **Alchemy Faucet**: https://sepoliafaucet.com/
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

### Pasos:
1. Conecta tu wallet (MetaMask, etc.)
2. Ve a uno de los faucets
3. Pega tu dirección de wallet
4. Recibe ETH de prueba (gratis)

## 🔗 Enlaces útiles

- **Sepolia Explorer**: https://sepolia.etherscan.io
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Documentación Sepolia**: https://ethereum.org/en/developers/docs/networks/#sepolia

## 🎯 Funcionalidades disponibles en Testnet

### Tokens de prueba:
- **DAI Test**: `0x1D70D57ccD2798323232B2dD027B3aBcA5C00091`
- **USDC Test**: `0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47`

### Operaciones disponibles:
- ✅ Ver balances de tokens
- ✅ Transferir tokens
- ✅ Aprobar gastos
- ✅ Minting de tokens (para testing)
- ✅ Ver historial de transacciones

## 🛡️ Seguridad

- **No uses dinero real** en testnet
- Los tokens de testnet no tienen valor real
- Las transacciones son gratuitas (solo gas de prueba)
- Perfecto para experimentar sin riesgo

## 🔧 Solución de problemas

### "Wrong Network Detected"
- Asegúrate de estar conectado a Sepolia en tu wallet
- En MetaMask: Settings → Networks → Add Network
- Chain ID: 11155111
- RPC URL: https://rpc.sepolia.org

### "Insufficient funds"
- Obtén ETH de prueba de un faucet
- Los faucets suelen dar 0.1-0.5 ETH de prueba

### Transacciones fallidas
- Verifica que tienes suficiente ETH para gas
- Asegúrate de estar en la red correcta
- Revisa los logs en la consola del navegador

## 🎉 ¡Listo para probar!

Tu aplicación está configurada para testnet. Conecta tu wallet y comienza a experimentar de forma segura con DeFi.

---

**Nota**: Esta es una aplicación de demostración. Los contratos y tokens son solo para propósitos educativos.
