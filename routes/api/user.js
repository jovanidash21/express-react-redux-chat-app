var express = require('express');
var router = express.Router({mergeParams: true});
var User = require('../../models/User');

router.get('/', function(req, res, next) {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    res.status(200).json(req.user);
  }
});

router.post('/search', function(req, res, next) {
  var query = req.body.query;

  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    User.find({
      _id: {
        $ne: req.user._id
      },
      name: {
        $regex: '\\b' + query,
        $options: 'i'
      }
    }, function(err, users) {
      if (!err) {
        res.status(200).send(users);
      } else {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      }
    });
  }
});

router.get('/all', function(req, res, next) {
  if (req.user === undefined) {
    res.status(401).send({
      success: false,
      message: 'Unauthorized'
    });
  } else {
    User.find({_id: {$ne: null}}, function(err, users) {
      if (!err) {
        res.status(200).send(users);
      } else {
        res.status(500).send({
          success: false,
          message: 'Server Error!'
        });
      }
    });
  }
});

module.exports = router;
