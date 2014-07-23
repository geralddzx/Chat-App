socketio = require('socket.io');

function createServer(server) {


  var io = socketio(server);
  var connectedUsers = {};
  var totalUserConnections = 0;
  var userRoom = {};
  var validNick = function(nick){
    if (nick.slice(0, 5) === "guest"){
      return false;
    }
    for (var id in connectedUsers){
      if (connectedUsers[id] === nick){
        return false;
      }
    }
    return true;
  };
  
  var userByRoom = function(room){
    users = [];
    for (var user in userRoom){
      if (userRoom[user] === room){
        users.push(connectedUsers[user]);
      }
    }
    return users;
  };

  io.on('connection', function(socket){
    console.log('received connection');
        
    totalUserConnections += 1;
    var nick = "guest " + totalUserConnections;
    connectedUsers[socket.id] = nick;
    var room = "lobby";
    userRoom[socket.id] = room;
    socket.join(room);
    
    var roomUserUpdate = function(room){
      users = userByRoom(room)
      socket.to(room).emit('roomUserUpdate', { users: users, room: room});
      socket.emit('roomUserUpdate', { users: users, room: room})
    }
    
    roomUserUpdate(room)

    socket.on('send_chat', function(data){
      socket.to(room).emit('display_chat', { message: data.message, nick: nick});
      socket.emit('display_chat', { message: data.message, nick: nick});
    });
  
    socket.on("nicknameChangeRequest", function(data){
      if (validNick(data.nick)){
        nick = data.nick;
        connectedUsers[socket.id] = nick;
        message = "Your display name has been changed to: " + nick;
        socket.emit('nicknameChangeResult', { message: message});
        roomUserUpdate(room)
      } else {
        message = "Invalid nickname";
        socket.emit('nicknameChangeResult', { message: message});
      }
    });
    
    socket.on("join_room", function(data){
      
      var oldRoom = room;
      room = data.room;
      socket.join(room);
      userRoom[socket.id] = room;
      
      socket.rooms.forEach(function(socketRoom) {
        if (room !== socketRoom){
          socket.leave(socketRoom);
        }
      });
      
      roomUserUpdate(oldRoom)
      roomUserUpdate(room)
    });
    
    socket.on('disconnect', function(){
      io.sockets.emit('display_chat', { message: "disconnected", nick: nick});
      delete connectedUsers[socket.id]; 
      delete userRoom[socket.id]
      roomUserUpdate(room)
    });
  });

}

module.exports.createServer = createServer;