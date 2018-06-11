const sockets = []

export default {

  addSocket(socket) {

    const userAddress = socket.decoded_token.userAddress.toLowerCase()

    sockets[userAddress] = sockets[userAddress] || []
    sockets[userAddress].push(socket)
  },

  removeSocket(socket) {

    const userAddress = socket.decoded_token.userAddress.toLowerCase()

    const userSockets = sockets[userAddress] || []
    const userSocketIndexToRemove = userSockets.indexOf(socket)

    if (userSocketIndexToRemove !== -1) {
      userSockets.splice(userSocketIndexToRemove, 1)
    }
  },

  emitToAddress(userAddress, eventName, eventData) {

    const userSockets = sockets[userAddress.toLowerCase()] || []

    userSockets.forEach((socket) => {
      socket.emit('user-event', { name: eventName, data: eventData })
    })

  },

}
