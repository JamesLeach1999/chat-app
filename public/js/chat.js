
// // socket just contains the return value. will be different based on the event
const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")

const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#users")

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locTemplate = document.querySelector("#loc-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML
const title = document.querySelector("#title").innerHTML

// options
// /?username=james&room=london is an object, so get the values with some destructuring
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

// AUTOMATC SCROLLING, call it right after rendering messages
const autoScroll = () => {
    // get new message element, gets the child (text input) of the last message
    const $newMessage = $messages

    // get the height of the new message, this dosent take into the account the margin
    // we need to get the style of the element to determine the margin in case you wanna change how it looks in the future
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // get the visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const contentHeight = $messages.scrollHeight

    // figure out how far down we have scrolled, this gives the amount of distance scrolled from the top
    const scrollOffset = $messages.scrollTop + visibleHeight
// this code scrolls us to the bottom. get total container height and subtract the height of the last message
    if(contentHeight - newMessageHeight <= scrollOffset){
        // set the value for how far down we've scrolled
        // if you jst wanna scroll to the bottom, just use this line
        $messages.scrollTop = $messages.scrollHeight
    }

}

// accepts 2 args, name of the event and function to run
socket.on("msg", (message) => {
    // also shows timestamps now
    console.log(message)
    // this stores final html to render
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("[Time:] LT, [Date:] L")
    })
    // here we just add html inside the messages div
   
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    var mess = document.querySelector("input").value

    // here we disable input whilst message is being sent
    $messageFormButton.setAttribute("disabled", "disabled")
    $messageFormInput.focus()

    // whenever the button is clicked, it emits the sen event again, in turn emitting the msg event. which is then updated and output above

    socket.emit("sendMessage", mess, (error) => {
        // wanna re-enable regardless of an error
        $messageFormButton.removeAttribute("disabled")

        if(error) {
            return console.log(error)
        }

        console.log("message delivered")
    })
    // access the server acknowledgment with the message parameter
    document.querySelector("input").value = ""
})

socket.on("locMsg", (message) => {

    console.log(message)
    const html = Mustache.render(locTemplate, {
        username: message.username,
        locMsg: message.text,
        // this is the moments library for formatting dates in js
        createdAt: moment(message.createdAt).format("[Time:] LT, [Date:] L")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
    
})
// listing out the users
socket.on("roomData", (room, users) => {
    var use = []
    console.log(users)
    
    var dunno = users.slice(-1)[0] 
    console.log(use)

    // TODO: stop the users array from repeating all values once another person joins/leaves
    const html = Mustache.render(sidebarTemplate, {
        room,
        users: users
        
    })
    document.querySelector("#sidebar-content1").insertAdjacentHTML("beforeend", html)

})
// GEOLOCATION
$sendLocation.addEventListener("click", () => {
    // if this dosent exist it means they dont have browser supprot
    if(!navigator.geolocation){
        return alert("Upgrade your browser its 2020")
    }
// these run until the below get current position works
    $sendLocation.setAttribute("disabled", "disabled")
    $sendLocation.focus()

    navigator.geolocation.getCurrentPosition((position) => {
        // geocoding browser output address
        // could also provide this as an object
        socket.emit("loc", position.coords.latitude, position.coords.longitude, (error) => {

            $sendLocation.removeAttribute("disabled")

            if(error){
                return console.log(error)
            }

            console.log("location delivered")
        })
        var loc = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&key=AIzaSyC6xrYHhT-_CeoktqgAwGjbOCNrmVUkXno"
        
    })

})
// username and room as params here
socket.emit("join", username, room, (error) => {
    if(error){
        alert(error)
        // this is your redirect
        location.href = "/"
    }

})
