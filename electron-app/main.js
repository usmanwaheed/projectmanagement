/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import screenshot from 'screenshot-desktop';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, dialog } from 'electron';
import WebSocket, { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;
let wss;
let receivedToken;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });


    mainWindow.loadURL('http://localhost:5173/home');

    wss = new WebSocketServer({ port: 3001 });

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.type === 'AUTH_TOKEN') {
                    receivedToken = data.token; // Extract just the token
                }
            } catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        });
    });

    async function requestPermission() {
        const choice = await dialog.showMessageBox({
            type: "question",
            buttons: ["Allow", "Deny"],
            title: "Screen Capture Permission",
            message: "Do you allow this app to capture screenshots in the background?",
        });
        return choice.response === 0;
    }

    async function takeScreenshot() {
        const timestamp = Date.now();
        const screenShotDir = path.join(__dirname, 'screenshots');
        fs.mkdirSync(screenShotDir, { recursive: true });
        const filePath = path.join(screenShotDir, `screenshot_${timestamp}.png`);

        try {
            const img = await screenshot();
            fs.writeFileSync(filePath, img);
            await uploadToBackend(filePath);
        } catch (err) {
            console.error("Error taking screenshot:", err);
        }
    }

    async function uploadToBackend(filePath) {
        try {
            const formData = new FormData();
            formData.append('image', fs.createReadStream(filePath));

            const response = await axios.post('http://localhost:6007/user/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${receivedToken}`,
                    'Accept': 'application/json',
                }
            });

        } catch (err) {
            console.error("Backend upload failed:", err.response ? err.response.data : err);
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    async function shouldTakeScreenshot() {
        if (!receivedToken) {
            return false;
        }

        try {
            const response = await axios.get('http://localhost:6007/user/can-capture', {
                headers: {
                    'Authorization': `Bearer ${receivedToken}`,
                    'Accept': 'application/json',
                }
            });
            const { isTimerActive, checkInTime } = response.data.data;
            return isTimerActive && checkInTime;
        } catch (error) {
            console.error('Failed to check timer status:', error);
            return false;
        }
    }


    // async function shouldTakeScreenshot() {
    //     try {
    //         const response = await axios.get('http://localhost:6007/user/can-capture', {
    //             headers: { 'Authorization': `Bearer ${receivedToken}` }
    //         });
    //          ("Response from shoulfTakeScreenShot", response)
    //         const { isTimerActive, checkInTime } = response.data.data;
    //          ("response of data", response);
    //         return isTimerActive && checkInTime;
    //     } catch (error) {
    //         console.error('Failed to check timer status:', error);
    //         return false;
    //     }
    // }

    // ... (keep all your existing imports and setup code)

    requestPermission().then((granted) => {
        if (granted) {

            function scheduleMinuteScreenshots() {
                // Run every minute
                const interval = setInterval(async () => {
                    const now = new Date();
                    const currentMinute = now.getMinutes();

                    // Skip the 4th minute (when minutes = 3 since it's 0-indexed)
                    if (currentMinute === 3) {
                        return;
                    }
                    await shouldTakeScreenshot();
                    // if (await shouldTakeScreenshot()) {
                    //     await takeScreenshot();
                    // } else {
                    //      ("Skipping screenshot, user is not checked in or timer not running.");
                    // }
                }, 60 * 1000); // Every minute

                // Clear and reset the interval at the top of each hour to avoid drift
                setTimeout(() => {
                    clearInterval(interval);
                    scheduleMinuteScreenshots();
                }, (60 - new Date().getMinutes()) * 60 * 1000);
            }

            scheduleMinuteScreenshots();
        } else {
            console.log("Permission denied! Screenshots will not be taken.");
        }
    });


});









// requestPermission().then((granted) => {
//     if (granted) {
//          ("Permission granted! Screenshots will be taken randomly 4 times an hour.");

//         function scheduleRandomScreenshots() {
//             const intervals = [];
//             for (let i = 0; i < 12; i++) {
//                 const delayMinutes = Math.floor(Math.random() * 60);
//                 intervals.push(delayMinutes);
//             }
//             intervals.sort((a, b) => a - b);

//             intervals.forEach((minute) => {
//                 setTimeout(async () => {
//                     if (await shouldTakeScreenshot()) {
//                         await takeScreenshot();
//                     } else {
//                          ("Skipping screenshot, user is not checked in or timer not running.");
//                     }
//                 }, minute * 60 * 1000);
//             });

//             setTimeout(scheduleRandomScreenshots, 60 * 60 * 1000);
//         }

//         scheduleRandomScreenshots();
//     } else {
//          ("Permission denied! Screenshots will not be taken.");
//     }
// });