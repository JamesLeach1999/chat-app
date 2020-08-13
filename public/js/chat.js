// // this is to load the socket into the browser 


// // socket just contains the return value. will be different based on the event
const socket = io()

// Elements
// dollar sign is just a convention. to let you know what you got is an element
const $messageForm = document.querySelector("#message-form")
// select elements within the dom element
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")

const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#users")
// templates
// how to get the html in the script tags in index.html. this turns it into renderable html
const messageTemplate = document.querySelector("#message-template").innerHTML
const locTemplate = document.querySelector("#loc-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML
const title = document.querySelector("#title").innerHTML
console.log(sidebarTemplate)
// const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML



// options
// location.search gives access to query string. use the qs (query string) library to make easier
// this turns it into an object but still contains the question mark. use ignore query prefix
// /?username=james&room=london is an object, so get the values with some destructuring
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

// AUTOMATC SCROLLING, call it right after rendering messages
const autoScroll = () => {
    // get new message element, gets the chidl (text input ) of the last message
    const $newMessage = $messages

    // get the height of the new message, this dosent take into the account the margin
    // we need to get the style of the element to determine the margin in case you wanna change how it looks in the future
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // console.log(newMessageMargin)

    // get the visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const contentHeight = $messages.scrollHeight

    // figure out how far down we have scrolled, this gives the amount of distance scrolled from the top
    const scrollOffset = $messages.scrollTop + visibleHeight
// this code scrolls us to the bottom. get totql container height and subtract the height of the last message
// we wanna firgure out if we were scrolled to the botto before the message was added in
    if(contentHeight - newMessageHeight <= scrollOffset){
        // ste the value for how far down we've scrolled
        // if you jst wanna scroll to the bottom, just use this line
        $messages.scrollTop = $messages.scrollHeight
    }

}

// accepts 2 args, name of the event and function to run
socket.on("msg", (message) => {
    // makes sense to render the messages here, for the html so it can be like dynamic
    // also shows timestamps now
    console.log(message)
    // this stores ifinal html to render
    // have to provide object with all the data you want to render. the key is the value you wanna access. so in the html it would be the messages bit
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        // message is now an object cos of generateMessage in index. have to access inv properties
        message: message.text,
        createdAt: moment(message.createdAt).format("[Time:] LT, [Date:] L")
    })
    // here we just add html inside the messagwes div
    
    // this renders for every time message are sent
    // METHODS FOR ADJACENT
    // idk
    // afterbegin adds html to the top of the div inside it, newer messages show up first
    // afterend is after the element closes so wouldnt even be inside the div
    // beforebegin is before the messages div
    // beforeend before the messages div ends. adds new messages to the bottom of the div
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll()
})
// can use the e param to access form data


$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()
    var mess = document.querySelector("input").value

    // here we disable input whilst message is being sent
    $messageFormButton.setAttribute("disabled", "disabled")
    // this just highlights something on the dom
    $messageFormInput.focus()

    // whenever the button is clicked, it emits the sen event again, in turn emitting the msg event. which is then updated and output above
    // pass in any values as second, third params
    // right, send the message to the server w client acknowledge function (last arg in emit), then access the server acknowledgment callback here

    socket.emit("sendMessage", mess, (error) => {
        // wanna renable regardless of an error
        $messageFormButton.removeAttribute("disabled")
        

        // here we reenable the form input once the message is sent
        // this shows message is delivered, the callback dosent have to run if all goes well. otherwise use the callback
        if(error) {
            return console.log(error)
        }

        console.log("message delivered")
    })
    // access the server acknowledgment with the message parameter
    document.querySelector("input").value = ""
})
// lol theres a bad words module


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

    
    const html = Mustache.render(sidebarTemplate, {
        room,
        users: users
        // username: dunno
        
    })
    // console.log(users)
    document.querySelector("#sidebar-content1").insertAdjacentHTML("beforeend", html)

})
// GEOLOCATION
$sendLocation.addEventListener("click", () => {
    // if this dosent exist it means they dont have browser supprot
    if(!navigator.geolocation){
        return alert("upgrade your browser its 2020")
    }
// these run until the below get current position works
    $sendLocation.setAttribute("disabled", "disabled")
    $sendLocation.focus()

// this is async, but isnt a promise so cant use async await. remember navigator is built into the browser
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
        // console.log(position.coords.latitude, position.coords.longitude)
        var loc = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&key=AIzaSyC6xrYHhT-_CeoktqgAwGjbOCNrmVUkXno"
        
    })

})
// username and room as params here
// broadcast is essentially conditional. if there is an error when its called in index it runs the error code in index. if nothing wrong ignore error param and carry on
socket.emit("join", username, room, (error) => {
    if(error){
        alert(error)
        // this is your redirect
        location.href = "/"
    }
    // const html = Mustache.render(sidebarTemplate, {
    //     users: username
    // })

    // document.querySelector("#sidebar-content1").insertAdjacentHTML("beforeend", html)

})

// Acknowledgments allow the reciever to acknowledge and process the event
// client sends off the message to server but cant be sure it did something with it. acknowledgment allows client to see it has been recieved 
// server (emit) -> client (recieve) - ascknowledgment --> server. server knows client processed it
// client (emit) -> server (recieve) - acknowledgment --> client. client knows server processed it
// in the form of a function as the final arguement