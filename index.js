#!/usr/bin/env node

import puppeteer from 'puppeteer'
import inquirer from 'inquirer';

// Define global variables
let accessToken
let channel
let browserPath

// Display welcome message
async function welcome() {
  console.log( `
  Welcome to Drop Watcher 👀.
  Press Ctrl+C to end this program at any time...

  This program will launch a headless browser and goto your favorite twitch channel
  It will then log you in, and stay on that page with your access-token
  You can get your access-token from the cookies when logged into twitch
  Right click and hit inspect, goto storage, cookies, and look for auth-token
  Copy that value and enter it when prompted
  `);
}

// Get the users access-token
async function getToken() {
  accessToken = await inquirer.prompt( {
    name: 'tokenValue',
    type: 'input',
    message: 'What was the value of your access-token\n',
  } )
}

// Get the channel the user wants to have open
async function getChannel() {
  channel = await inquirer.prompt( {
    name: 'name',
    type: 'input',
    message: 'What is the channel you want to watch for drops?'
  } )
}

// Get the path for the chrome browser
async function defineBrowserPath() {
  const pathInput = await inquirer.prompt( {
    name: 'path',
    type: 'input',
    message: `What is the path to your chrome browser. 
    If unsure, in a new terminal window type whereis google-chrome.
    The default value is /usr/bin/google-chrome, to use it just press enter
    `
  } )

  // if no value is passed, default to the linux install path
  if ( !pathInput.path.trim().length ) {
    browserPath = { path: '/usr/bin/google-chrome' }
  } else {
    browserPath = pathInput.path
  }
}

// Launch browser, add cookie, reload for logged in state
async function watchTwitchStreams() {
  const browser = await puppeteer.launch( {
    headless: true, executablePath: `${ browserPath.path.trim() }`
  } );
  console.log( 'launching browser' )
  const page = await browser.newPage();
  await page.goto( `https://twitch.tv/${ channel.name.trim() }` );
  console.log( 'Navigating to twitch' )
  await page.evaluate( () => {
    localStorage.setItem( 'mature', 'true' )
    localStorage.setItem( 'video-muted', '{"default":false}' )
    localStorage.setItem( 'volume', '0.5' )
    localStorage.setItem( 'video-quality', '{"default":"160p30"}' )
  } )
  console.log( 'setting local storage items' )
  const cookies = [ {
    'name': 'auth-token',
    'value': `${ accessToken.tokenValue.trim() }`
  } ]
  await page.setViewport( { width: 1280, height: 720 } )
  await page.setCookie( ...cookies )
  await page.reload( {
    waitUntil: [ "networkidle2", "domcontentloaded" ], timeout: 4000
  } )
  console.log( `logged in to twitch and watching ${ channel.name.trim() }` )
  console.log( 'Press Ctrl+C to exit at any time' )
}


await welcome()
await defineBrowserPath()
await getChannel()
await getToken()
await watchTwitchStreams()