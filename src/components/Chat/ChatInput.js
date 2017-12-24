import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Input,
  Button
} from 'muicss/react';
import FontAwesome from 'react-fontawesome';
import './styles.scss';

class ChatInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      typing: false
    };
  }
  onMessageChange(event) {
    event.preventDefault();

    const messageValue = event.target.value;
    const {
      userData,
      activeChatRoomData,
      handleSocketIsTyping,
      handleSocketIsNotTyping
    } = this.props
    const { typing } = this.state;

    this.setState({message: messageValue});

    if ( (messageValue.length > 0) && (!typing) ) {
      handleSocketIsTyping(userData, activeChatRoomData._id);
      this.setState({typing: true});
    }

    if ( (messageValue.length === 0) && (typing) ) {
      handleSocketIsNotTyping(userData, activeChatRoomData._id);
      this.setState({typing: false});
    }
  }
  handleSendMessage(event) {
    const {
      userData,
      activeChatRoomData,
      handleSocketIsNotTyping,
      handleSendMessage
    } = this.props;
    const { message } = this.state;
    const newMessage = {
      text: message.trim(),
      user: userData,
      chatRoom: activeChatRoomData
    };

    if ( event.key === 'Enter' ) {
      handleSocketIsNotTyping(userData, activeChatRoomData._id);
      handleSendMessage(newMessage);
      this.setState({
        message: '',
        typing: false
      });
    }
  }
  render() {
    const {
      message,
      typing
    } = this.state

    return (
      <div className="chat-input">
        <Input
          hint="Type here"
          value={message}
          onChange={::this.onMessageChange}
          onKeyDown={::this.handleSendMessage}
        />
        <Button className="send-button" onClick={::this.handleSendMessage} disabled={!typing}>
          <FontAwesome
            name="paper-plane"
            size="2x"
          />
        </Button>
      </div>
    )
  }
}

ChatInput.propTypes = {
  userData: PropTypes.object.isRequired,
  activeChatRoomData: PropTypes.object.isRequired,
  handleSocketIsTyping: PropTypes.func.isRequired,
  handleSocketIsNotTyping: PropTypes.func.isRequired,
  handleSendMessage: PropTypes.func.isRequired
}

export default ChatInput;
