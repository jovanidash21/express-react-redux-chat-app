var express = require('express');
var router = express.Router({mergeParams: true});
var User = require('../../models/User');
var ChatRoom = require('../../models/ChatRoom');
var Message = require('../../models/Message');

router.post('/', (req, res, next) => {
  var userID = req.body.userID;

  if ((req.user === undefined) || (req.user._id != userID)) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    User.findById(userID, 'chatRooms')
      .populate({
        path: 'chatRooms.data',
        populate: {
          path: 'members',
          select: '-chatRooms -socketID'
        }
      })
      .exec()
      .then((user) => {
        var userChatRooms = user.chatRooms;

        for (var i = 0; i < userChatRooms.length; i++) {
          var chatRoom = userChatRooms[i].data;

          for (var j = 0; j < chatRoom.members.length; j++) {
            var member = chatRoom.members[j];

            if (chatRoom.chatType === 'private') {
              if (member._id == userID) {
                chatRoom.chatIcon = member.profilePicture;
              }
            } else if (chatRoom.chatType === 'direct') {
              if (member._id != userID) {
                chatRoom.name = member.name;
                chatRoom.chatIcon = member.profilePicture;
              }
            } else if (chatRoom.chatType === 'group' || chatRoom.chatType === 'public') {
              chatRoom.members[j] = member._id;
            }
          }
        }
        res.status(200).send({
          success: true,
          message: 'Chat Rooms Fetched',
          chatRooms: userChatRooms
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

router.post('/create', (req, res, next) => {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var name = req.body.name;
    var chatType = req.body.chatType;
    var members = req.body.members;
    var chatRoomData = {
      name,
      chatType,
      members
    };

    if ("chatIcon" in req.body) {
      chatRoomData.chatIcon = req.body.chatIcon;
    }

    if (chatType === 'private' || chatType === 'public') {
      res.status(401).send({
        success: false,
        message: 'Unauthorized'
      });
    } else if (chatType === 'direct' && members.length !== 2) {
      res.status(401).send({
        success: false,
        message: 'Please select 2 members'
      });
    } else if (chatType === 'group' && members.length < 3) {
      res.status(401).send({
        success: false,
        message: 'Please select at least 3 members'
      });
    } else {
      ChatRoom.findOne({members: {$all: members}, chatType: 'direct'}, (err, chatRoom) => {
        if (!err) {
          if (chatRoom !== null) {
            res.status(401).send({
              success: false,
              message: 'Chat room already exist'
            });
          } else {
            var chatRoom = new ChatRoom(chatRoomData);

            chatRoom.save()
              .then((chatRoomData) => {
                for (var i = 0; i < chatRoomData.members.length; i++) {
                  var chatRoomMember = chatRoomData.members[i];

                  User.findByIdAndUpdate(
                    chatRoomMember,
                    { $push: { chatRooms: { data: chatRoomData._id, mute: {} } } },
                    { safe: true, upsert: true, new: true }
                  ).exec();
                }

                return ChatRoom.findById(chatRoomData._id)
                  .populate('members', '-chatRooms -socketID');
              })
              .then((chatRoomData) => {
                res.status(200).send({
                  success: true,
                  message: 'Chat Room Created',
                  chatRoom: {
                    data: chatRoomData,
                    unReadMessages: 0,
                    mute: {
                      data: false
                    }
                  }
                });
              })
              .catch((error) => {
                res.status(500).send({
                  success: false,
                  message: 'Server Error!'
                });
              });
          }
        } else {
          res.status(500).send({
            success: false,
            message: 'Server Error!'
          });
        }
      });
    }
  }
});

router.post('/clear-unread', (req, res, next) => {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var userID = req.body.userID;
    var chatRoomIDs = req.body.chatRoomIDs;

    User.findById(userID)
      .then((user) => {
        for (var i = 0; i < chatRoomIDs.length; i++) {
          var chatRoomID = chatRoomIDs[i];

          User.updateOne(
            { _id: userID, 'chatRooms.data': chatRoomID },
            { $set: { 'chatRooms.$.unReadMessages': 0 } },
            { safe: true, upsert: true, new: true }
          ).exec();
        }

        res.status(200).send({
          success: true,
          message: 'Chat Room Unread Messages Cleared',
          chatRoomIDs: chatRoomIDs
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

router.post('/mute', (req, res, next) => {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var userID = req.body.userID;
    var chatRoomID = req.body.chatRoomID;

    User.updateOne(
      { _id: userID, 'chatRooms.data': chatRoomID },
      { $set: { 'chatRooms.$.mute.data': true, 'chatRooms.$.mute.endDate': new Date() } },
      { safe: true, upsert: true, new: true }
    )
    .then(() => {
      res.status(200).send({
        success: true,
        message: 'Chat Room Muted',
        chatRoomID: chatRoomID
      });
    })
    .catch((error) => {
      res.status(500).send({
        success: false,
        message: 'Server Error!'
      });
    });
  }
});

router.post('/unmute', (req, res, next) => {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var userID = req.body.userID;
    var chatRoomID = req.body.chatRoomID;

    User.updateOne(
      { _id: userID, 'chatRooms.data': chatRoomID },
      { $set: { 'chatRooms.$.mute.data': false, 'chatRooms.$.mute.endDate': new Date() } },
      { safe: true, upsert: true, new: true }
    )
    .then(() => {
      res.status(200).send({
        success: true,
        message: 'Chat Room Unmuted',
        chatRoomID: chatRoomID
      });
    })
    .catch((error) => {
      res.status(500).send({
        success: false,
        message: 'Server Error!'
      });
    });
  }
});

router.get('/count', (req, res, next) => {
  if (req.user === undefined || req.user.role !== 'admin') {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    ChatRoom.countDocuments({_id: {$ne: null}})
      .then((chatRoomsCount) => {
        res.status(200).send({
          success: true,
          message: 'Chat Rooms Count Fetched',
          count: chatRoomsCount
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

router.post('/select', (req, res, next) => {
  if (req.user === undefined || req.user.role !== 'admin') {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var chatRoomID = req.body.chatRoomID;

    ChatRoom.findById(chatRoomID)
      .populate('members', '-chatRooms -socketID')
      .exec()
      .then((chatRoom) => {
        for (var i = 0; i < chatRoom.members.length; i++) {
          var member = chatRoom.members[i];

          if (chatRoom.chatType === 'private') {
            chatRoom.chatIcon = member.profilePicture;
          } else if (chatRoom.chatType === 'direct') {
            if (chatRoom.name.length) {
              chatRoom.name = chatRoom.name + ' / ' + member.name;
            } else {
              chatRoom.name = member.name;
            }
          }
        }

        return chatRoom;
      })
      .then((chatRoom) => {
        res.status(200).send({
          success: true,
          message: 'Chat Rooms Selected',
          chatRoom: chatRoom
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

router.get('/all', (req, res, next) => {
  if (req.user === undefined || req.user.role !== 'admin') {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    ChatRoom.find({_id: {$ne: null}})
      .populate('members', '-chatRooms -socketID')
      .exec()
      .then((chatRooms) => {
        for (var i = 0; i < chatRooms.length; i++) {
          var chatRoom = chatRooms[i];

          for (var j = 0; j < chatRoom.members.length; j++) {
            var member = chatRoom.members[j];

            if (chatRoom.chatType === 'private') {
              chatRoom.chatIcon = member.profilePicture;
            } else if (chatRoom.chatType === 'direct') {
              if (chatRoom.name.length) {
                chatRoom.name = chatRoom.name + ' / ' + member.name;
              } else {
                chatRoom.name = member.name;
              }
            } else if (chatRoom.chatType === 'group' || chatRoom.chatType === 'public') {
              chatRoom.members[j] = member._id;
            }
          }
        }

        return chatRooms;
      })
      .then((chatRooms) => {
        res.status(200).send({
          success: true,
          message: 'Chat Rooms Fetched',
          chatRooms: chatRooms
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

router.post('/edit', (req, res, next) => {
  var chatRoomID = req.body.chatRoomID;

  if (req.user === undefined || req.user.role !== 'admin') {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    var name = req.body.name;
    var chatType = req.body.chatType;
    var members = req.body.members;
    var chatIcon = req.body.chatIcon;
    var chatRoomData = {
      name: name,
      chatType: chatType,
      members: members,
      chatIcon: chatIcon
    };

    if (chatType === 'private' || chatType === 'direct' || chatType === 'public') {
      res.status(401).send({
        success: false,
        message: 'Unauthorized'
      });
    } else if (chatType === 'group' && members.length < 3) {
      res.status(401).send({
        success: false,
        message: 'Please select at least 3 members.'
      });
    } else {
      ChatRoom.findById(chatRoomID)
        .then((chatRoom) => {
          for (var i = 0; i < members.length; i++) {
            var chatRoomMember = members[i];

            if (!chatRoom.members.some((singleMember) => singleMember === chatRoomMember)) {
              User.findByIdAndUpdate(
                chatRoomMember,
                { $push: { chatRooms: { data: chatRoom._id, unReadMessages: 0 } } },
                { safe: true, upsert: true, new: true }
              ).exec();
            }
          }

          for (var i = 0; i < chatRoom.members.length; i++) {
            var chatRoomMember = chatRoom.members[i];

            if (!members.some((singleMember) => singleMember === chatRoomMember)) {
              User.findByIdAndUpdate(
                chatRoomMember,
                { $pull: {chatRooms: {data: chatRoomID}} },
                { safe: true, upsert: true, new: true }
              ).exec();
            }
          }

          ChatRoom.updateOne(
            { _id: chatRoomID },
            { $set: chatRoomData },
            { safe: true, upsert: true, new: true },
          ).exec();
        })
        .then((chatRoom) => {
          res.status(200).send({
            success: true,
            message: 'Chat Room Edited'
          });
        })
        .catch((error) => {
          res.status(500).send({
            success: false,
            message: 'Server Error!'
          });
        });
    }
  }
});

router.post('/delete', (req, res, next) => {
  var chatRoomID = req.body.chatRoomID;

  if (req.user === undefined || req.user.role !== 'admin') {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    ChatRoom.findById(chatRoomID)
      .then((chatRoom) => {
        for (var i = 0; i < chatRoom.members.length; i++) {
          var memberID = chatRoom.members[i];

          User.findByIdAndUpdate(
            memberID,
            { $pull: {chatRooms: {data: chatRoomID}} },
            { new: true, upsert: true }
          ).exec();
        }

        Message.deleteMany({chatRoom: chatRoomID}).exec();
        ChatRoom.deleteOne({_id: chatRoomID}).exec();

        res.status(200).send({
          success: true,
          message: 'Chat Room Deleted'
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      });
  }
});

module.exports = router;
