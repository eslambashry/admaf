import express from 'express'
import path from 'path'
import { config } from 'dotenv'
import { databaseConnection } from './DB/connection.js'
import color from "@colors/colors"

config({path:path.resolve('./config/.env')})
const app = express()
app.use(express.json());

const port = process.env.PORT
databaseConnection()
app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}`.brightBlue.bold.underline))