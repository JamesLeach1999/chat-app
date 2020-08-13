const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")
// i guess destructuring makes sense when the function name is the same
const { generateMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")
const app = express()
// this dosent change the behaviour. cant create socket on express directly, dosent support it
const server = http.createServer(app)
// here we configure the web socket to work with the server
// this also sets up a file to be served up by a page
const io = socketio(server)



const port = process.env.PORT || 3000

const pubDirPath = path.join(__dirname, "../public")

// express.static for serving up static pages like html. anything else like hbs is render
app.use(express.static(pubDirPath))
// when using io here, its whenever a client connects, connection is just an option parameter for the on function. 
// here is only on server side, need to configure client seperately


// server (emit) -> client (recieve) - countUpdated
// client (emit) -> server (recieve) - increment

// socket contains info about the new connection. if 5 clients, run 5 times
// only ever use io.on for connection, dosent work for disconnect
io.on("connection", (socket) => {
    // we send and recieve events. we send it from server and wanna recieve on client. 
    // anything we provide on emit past the first arg is gonna be available from the callback on the client
    // right so here it initialises the event and sends the data 0 to the client
    // socket.emit("msg", generateMessage("welcome"))
    // BROADCASTING
    // broadcasting is where everyone else gets the message but you. everyone else sees a new user joined
    // timestamps, send back an object to send multiple values
    // socket.broadcast.emit("msg", generateMessage("new user joined"))

    // access the param value sent back from the sen event
    // we call callback to acknowledge the event, the callback is whats done in chat.js
    // room is only accessible in this function
    socket.on("join", (username, room, callback) => {
        // since username and room arent sanitised, we pass it into add user and use those return values

        // socket.id is the id for that particular connection. we get back an object here which we can destructur
        // makes sense cos we either get back the error or the user key from the object
        const {error, user} = addUser(socket.id ,username, room)

        if(error){
            // need to set up the acknowledgment on chat.js for the join function
            return callback(error)
        }
        // this only runs if user added
        // can only use this on server side. we specifically emit events to just that room, so only people in that room see it
        socket.join(user.room)

        socket.emit("msg", generateMessage("welcome"))
        socket.broadcast.to(user.room).emit("msg", generateMessage(`${user.username} has joined`))
        // list all users in the room
        const roro = getUsersInRoom(room)
        io.to(user.room).emit("roomData", user.room, getUsersInRoom(user.room))

        // this lets the client (code) know you were able to join
        callback()

        // 2 new setups for emitting messages. 
        // io.to.emit sends messagw to everyone in that specific room
        // socket.broadcast.to.emit sends event to everyone but client and limits to specific chat room
    })
    socket.on("sendMessage", (mess, callback) => {

        const user = getUser(socket.id)
        console.log(user)
        const filter = new Filter()
        // will return true or false if profane. just a method used on a class
        console.log(mess)
        if(filter.isProfane(mess)){
            // stops execution here
            return callback("No profanity")
        }
        // wont get down here if not bad word
        // this essentially updates the param and sends it back. also emits to all clients cos of the io
        // the to bit is the room you want. so it only broadcasts the message the people in "london" currently
        io.to(user.room).emit("msg", generateMessage(user.username, mess))
        // only emits when there is profanity
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

// socket.emit emits to the particular socket connection 
// socket.boradcast.emit emits to the particular connection the clients make BUT YOU
// io.emit emits to everyone

server.listen(port, () => {
    console.log("server up on port " + port)
})

// THIS USUALLY LIVES ABOVE IN THE IO.ON BIT
// all your events will be custom. emit just sends data to the client
// anything after the first event name will be available from the client