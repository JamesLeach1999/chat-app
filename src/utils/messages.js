// with this we can just use this for text and timestamp instead of setting up the object inline

const generateMessage = (username, text) => {
    return {
        username: username,
        text: text,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage
}