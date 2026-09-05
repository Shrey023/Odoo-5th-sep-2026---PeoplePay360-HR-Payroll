import { app } from './app.js'
import { env } from './config/env.js'

app.listen(env.port, () => {
  console.log(`PeoplePay360 API listening on http://localhost:${env.port}`)
})
