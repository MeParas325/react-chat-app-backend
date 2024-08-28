const express = require("express")
const socketIO = require("socket.io")
const http = require("http")
const cors = require("cors")

const {addUser, removeUser, getUser, getUsersInRoom} = require("./user")

const app = express()
const PORT = process.env.PORT || 5000

const server = http.createServer(app)
const io = socketIO(server)

app.use(cors({
    origin: "https://react-chat-app-frontend-pi.vercel.app/",
    methods: ["POST", "GET"],
    credentials: true,
}))

// checking connected and disconnected user
io.on("connection", (socket) => {

    socket.on("join", ({name, room}) => {

        const result = addUser({id: socket.id, name: name, room: room})

        if(result.error) return 

        socket.emit("message", ({ user: 'admin', text: `${result.name}, welcome to the room ${result.room}`}))
        socket.broadcast.to(result.room).emit("message", ({ user: "admin", text: `${result.name} has joined the chat`}))

        socket.join(result.room) 

        io.to(result.room).emit("roomData", {room: result.room, users: getUsersInRoom(result.room)})

    })

    socket.on("sendMessage", (message) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("message", { user: user.name, text: message})
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit("message", {user: "admin", text: `${user} has left the chat`})
            io.to(user.room).emit("roomData", {room: user.room, users: getUsersInRoom(user.room)})
        }

    })
})

const router = require("./router")
// middleware
app.use(router)


server.listen(PORT, () => console.log(`Server is running at ${PORT}`))

