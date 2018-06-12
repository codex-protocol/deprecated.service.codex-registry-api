import Bluebird from 'bluebird'
import socketioJwt from 'socketio-jwt'

import socketService from '../services/socket'

export default (socketApp) => {

  socketApp.use(socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true,
  }))

  socketApp.on('connection', (socket) => {
    socketService.addSocket(socket)
    socket.on('disconnect', () => { socketService.removeSocket(socket) })
  })

  return Bluebird.resolve(socketApp)

}
