
const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")

const { generateMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")
const app = express()
const server = http.createServer(app)

const io = socketio(server)



const port = process.env.PORT || 3000

const pubDirPath = path.join(__dirname, "../public")

// setting up public directory path and serving index
app.use(express.static(pubDirPath))


// initial connection to socket.io
io.on("connection", (socket) => {
    

    // joining room with socket id,username and room, sanitising and pushing to the roomData event
    socket.on("join", (username, room, callback) => {
        // since username and room arent sanitised, we pass it into add user and use those return values

        // socket.id is the id for that particular connection. we get back an object here which we can destructur
        
        const {error, user} = addUser(socket.id ,username, room)

        if(error){
            // need to set up the acknowledgment on chat.js for the join function
            return callback(error)
        }
        // this only runs if user added
        socket.join(user.room)

        socket.emit("msg", generateMessage("welcome"))
        socket.broadcast.to(user.room).emit("msg", generateMessage(`${user.username} has joined`))
        // list all users in the room
        
        io.to(user.room).emit("roomData", user.room, getUsersInRoom(user.room))

        // this lets the client (code) know you were able to join
        callback()

        
    })
    socket.on("sendMessage", (mess, callback) => {

        const user = getUser(socket.id)
        console.log(user)
        const filter = new Filter()
        // will return true or false if profane. just a method used on a class
        console.log(mess)
        if(filter.isProfane(mess)){
            // stops execution here
            return callback("no profanity")
        }
        // wont get down here if a bad word is present
        // this essentially updates the param and sends it back. also emits to all clients cos of the io
        io.to(user.room).emit("msg", generateMessage(user.username, mess))
        // only emits when there is not profanity
        callback()
    })
// cos of generate message you can now access the message value whether it be join, leave, message and thetimestamp too
    socket.on("loc", (lat, lng, callback) => {

        const user = getUser(socket.id)
        console.log(user)
        // in the future just use template strings
        if(!lat || !lng){
            return callback("location not recieved")
        }
        io.to(user.room).emit("locMsg", generateMessage(user.username ,`https://www.google.com/maps?q=${lat},${lng}`))
        callback()
    })

    // have to make a seperate event to disconnect and have to do it on socket so its a connection event. still broadcast to everyone. these events are built in params
    socket.on("disconnect", () => {

        const user = removeUser(socket.id)
// theres a chance the person who is disconnecting was never part of a room. ie join with invalid data then disconnect, the below  message dosent need to show
// the return value from removeUser is a user, so if user true then remove
        if(user) {
            io.to(user.room).emit("msg", generateMessage(`${user.username} has left`))
            io.to(user.room).emit("roomData", user.room, getUsersInRoom(user.room))

        }

        // dont need to broadcast cos client already disconnected
    })

})



server.listen(port, () => {
    console.log("server up on port " + port)
})
