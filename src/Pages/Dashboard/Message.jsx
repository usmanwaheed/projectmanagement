import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { axiosInstance } from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthProvider";

const Message = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [image, setImage] = useState(null);
    const [newRoom, setNewRoom] = useState("");
    const [memberIds, setMemberIds] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Setup socket
    useEffect(() => {
        const s = io("http://localhost:6007");
        setSocket(s);
        if (user?._id) {
            s.emit("register", user._id);
        }
        s.on("onlineUsers", setOnlineUsers);
        s.on("newMessage", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => {
            s.disconnect();
        };
    }, [user]);

    // Load rooms
    useEffect(() => {
        if (user?._id) {
            axiosInstance.get("/chat/rooms").then((res) => {
                setRooms(res.data.data || []);
            });
        }
    }, [user]);

    const createRoom = async () => {
        const members = memberIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        try {
            const res = await axiosInstance.post("/chat/rooms", {
                name: newRoom,
                members,
            });
            setRooms((prev) => [...prev, res.data.data]);
            setNewRoom("");
            setMemberIds("");
        } catch (e) {
            console.error(e);
        }
    };

    const joinRoom = async (room) => {
        setCurrentRoom(room);
        setMessages([]);
        socket && socket.emit("joinRoom", room._id);
        const res = await axiosInstance.get(`/chat/rooms/${room._id}/messages`);
        setMessages(res.data.data || []);
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };

    const sendMessage = async () => {
        if (!currentRoom) return;
        let type = "text";
        let content = text;
        if (image) {
            type = "image";
            content = image;
        } else if (/https?:\/\//.test(text)) {
            type = "link";
        }
        await axiosInstance.post(`/chat/rooms/${currentRoom._id}/messages`, {
            content,
            type,
        });
        setText("");
        setImage(null);
    };

    const isOnline = (id) => {
        const userId = typeof id === "object" ? id._id : id;
        return onlineUsers.includes(userId);
    };

    return (
        <div style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
            <div style={{ width: "200px" }}>
                <h3>Rooms</h3>
                <ul>
                    {rooms.map((r) => (
                        <li
                            key={r._id}
                            onClick={() => joinRoom(r)}
                            style={{ cursor: "pointer", fontWeight: currentRoom?._id === r._id ? "bold" : "normal" }}
                        >
                            {r.name}
                        </li>
                    ))}
                </ul>
                <input
                    placeholder="Room name"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                />
                <input
                    placeholder="Member IDs, comma separated"
                    value={memberIds}
                    onChange={(e) => setMemberIds(e.target.value)}
                />
                <button onClick={createRoom}>Create</button>
            </div>
            {currentRoom && (
                <div style={{ flex: 1 }}>
                    <h3>{currentRoom.name}</h3>
                    <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ccc" }}>
                        <ul>
                            {messages.map((m, i) => (
                                <li key={i}>
                                    <span
                                        style={{ color: isOnline(m.sender) ? "green" : "gray", marginRight: "4px" }}
                                    >
                                        ●
                                    </span>
                                    <strong style={{ marginRight: "4px" }}>
                                        {typeof m.sender === "object" ? m.sender.name : ""}
                                    </strong>
                                    {m.type === "image" ? (
                                        <img src={m.content} alt="" width={100} />
                                    ) : (
                                        <span>{m.content}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message"
                    />
                    <input type="file" onChange={handleFile} />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}
        </div>
    );
};

export default Message;
