/* eslint-disable no-undef */
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT || 6007;
const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        const httpServer = createServer(app);
        const io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:5173",
                credentials: true,
            },
        });
        app.set("io", io);

        const onlineUsers = new Map();
        io.on("connection", (socket) => {
            socket.on("register", (userId) => {
                onlineUsers.set(userId, socket.id);
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
            });

            socket.on("disconnect", () => {
                for (const [id, sid] of onlineUsers.entries()) {
                    if (sid === socket.id) {
                        onlineUsers.delete(id);
                        break;
                    }
                }
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
            });

            socket.on("joinRoom", (roomId) => {
                socket.join(roomId);
            });
        });

        httpServer.listen(port, () => {
            console.log(`server port http://localhost:${port}/user/`);
        });
    } catch (error) {
        console.log("Connection failed at Index.js", error);
    }
};

startServer();
