const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')
const $sendLocationButton = document.querySelector('#send-location')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message elemnt
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const $newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt($newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container, which contains all messages
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled. 
    const scrollOffset = $messages.scrollTop + visibleHeight

    // if last time I have scroll at the bottom of the place("bottom" just before the new message comes)
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    } 
    // todo: else remind that there are new messages below
}

socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('localMessage', (locationInfos)=>{

    const html = Mustache.render(locationTemplate, {
        username:  locationInfos.username,
        url: locationInfos.url,
        createdAt: moment(locationInfos.createdAt).format('h:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent to refresh the browser
    
    
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const message = event.target.elements.message.value
    
    socket.emit('sendMessage', message, (error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }

        console.log('the message was delivered')
    })

})


$sendLocationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const location = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }

        socket.emit('sendLocation', location, (error)=>{
            // getting the ackowledgement

            $sendLocationButton.removeAttribute('disabled')
            if(error){
                return console.log(error)
            }
            console.log('Location shared')
        })
    })  
})

socket.emit('join', {username, room}, (error) => {
  if(error){
      alert(error)
      location.href = "/"

  }
})