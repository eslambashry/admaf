import path from 'path'
import { config } from 'dotenv'
import { databaseConnection } from './DB/connection.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import userRouter from './src/module/auth/auth.routes.js'
import color from "@colors/colors"
import { logger } from 'hono/logger'
import { globalErrorHandler } from './src/middleware/ErrorHandeling.js'

config({path:path.resolve('./config/.env')})
const app = new Hono()
const hono = new Hono()
const port = process.env.PORT



app.use('*', globalErrorHandler)
app.use('*', logger()) // Optional: for logging requests
app.route("/auth",userRouter)

databaseConnection()

serve({
  fetch: app.fetch,
  port: port,
}, () => {
  console.log(`Server running on port ${port}`.yellow.bold.underline)
})