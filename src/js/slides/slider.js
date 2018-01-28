require('socketcluster-client')
require('google-authentication-helper')
'
const clientID = '948918026196-p399ooibc7pr0ci7ida63jb5a6n4vsik.apps.googleusercontent.com'
module.exports = () => {
  return (deck) => {
    let socket = socketCluster.connect({
      hostname: 'localhost',
      port: 8000
    })
    socket.on('error', function (err) { throw(err) })

    let login = (user) => {
      socket.emit('login', user, function (err) {
        console.log(err)
        if (err) {
          window.googleLoginHelper.start()
        }
      })
    }
    window.googleLoginHelper
      .config(clientID)
      .login(user => {
        login(user)
      })
      .manual(error => {
        // Need to enable manual signin here
        console.log(error)
      })
    socket.on('connect', function (status) {
      if (!(status.isAuthenticated)) {
        window.googleLoginHelper.start()
      } else {
        console.log("Already authenticated")
      }
    })
  }
}
