// for keeping track of users

const users = []

// every socket has a unique id
const addUser = (id, username, room) => {
    // clean the data. convert to lowercase, trim spaces etc
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data, see if its there
    if(!username || !room) {
        return {
            error: "username and room are required"
        }
    }

    // check for exisiting user
    const existingUser = users.find((user) => {
        // checks the room name is not the same, checks username is unique
        return user.room === room && user.username === username
    })

    // validate username
    if(existingUser){
        return {
            error: "username is in use"
        }
    }

    // user is now ready to be stored
    const user = { id, username, room}
    // puts the user on to the users array
    users.push(user)

    return {user}
}

const removeUser = (id) => {
    // minuns one for no match, 0 or greater for a match. findIndex just finds the position, returns true and the number if there is a match
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if(index !== -1) {
        // 1st arg is the position of what to remov, second arg is the nuber of items to remove. this returns an array
        // its an array of objects, so need to access first object ie first element of array
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    const use = users.find((user) => {
        if(user.id === id){
            return user
        }
    })
    return use
}
// this is all basic you dont need comments
const getUsersInRoom = (room) =>{
    const userRoom = users.filter((user) => {
        if(room === user.room){
            return user
        }
    })
    return userRoom
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}