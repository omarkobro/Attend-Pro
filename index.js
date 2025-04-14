import express from 'express'
import { config } from 'dotenv'
import { initiateApp } from './src/initiateApp.js';

config({path: "./config/dev.config.env"})
let app = express();

initiateApp(app, express)