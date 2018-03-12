let BACKEND_DOMAIN = 'http://localhost:3002'
if (process.env.NODE_ENV === 'production') {
  BACKEND_DOMAIN = 'http://172.27.142.9:3002'
} else if (process.env.NODE_ENV === 'development') {
  BACKEND_DOMAIN = 'http://localhost:3002'
}
export default {
  BACKEND_DOMAIN
}
