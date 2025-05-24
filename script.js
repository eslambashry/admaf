import path from 'path'
import { config } from 'dotenv'
import { databaseConnection } from './DB/connection.js'
import color from "@colors/colors"
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

config({path:path.resolve('./config/.env')})
const app = new Hono()
const port = process.env.PORT

databaseConnection() 
serve({
  fetch: app.fetch,
  port: Number(port),
}, () => {
  console.log(`Server running on port ${port}`.yellow.bold.underline + ' 💉')
})