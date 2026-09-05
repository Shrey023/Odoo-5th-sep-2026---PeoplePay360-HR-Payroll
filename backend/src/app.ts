import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

import { apiRouter } from './routes/index.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

export const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use('/api', apiRouter)

app.use(notFound)
app.use(errorHandler)
