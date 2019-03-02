import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar } from '../Avatar';
import { EditProfileModal } from './EditProfileModal';
import './styles.scss';

class UserDropdown extends Component {
  constructor(props) {
    super(props);
  }
  handleOpenEditProfileModal(event) {
    event.preventDefault();

    const { handleOpenEditProfileModal } = this.props;

    handleOpenEditProfileModal();
  }
  render() {
    const {
      user,
      children
    } = this.props;

    return (
      <div className="mui-dropdown user-dropdown">
        <div className="dropdown-toggle" data-mui-toggle="dropdown">
          <Avatar
            image={user.profilePicture}
            size="32px"
            name={user.name}
            roleChatType={user.role}
            accountType={user.accountType}
            badgeCloser
          />
          <div className="arrow-down-icon">
            <FontAwesomeIcon icon="caret-down" />
          </div>
        </div>
        <ul className="dropdown-menu has-pointer mui-dropdown__menu mui-dropdown__menu--right">
          <li>
            <div className="user-detail">
              <div className="user-full-name">
                {user.name}
              </div>
              <div className="user-username">
                {
                  user.accountType === 'local'
                    ? '@' + user.username
                    : user.accountType
                }
              </div>
            </div>
          </li>
          <li>
            <div className="divider" />
          </li>
          <li>
            <a href="#" onClick={::this.handleOpenEditProfileModal}>
              <div className="option-icon">
                <FontAwesomeIcon icon="user-edit" />
              </div>
              Edit profile
            </a>
          </li>
          <li>
            <a href="/logout">
              <div className="option-icon">
                <FontAwesomeIcon icon="sign-out-alt" />
              </div>
              Logout
            </a>
          </li>
        </ul>
        {children}
      </div>
    )
  }
}

UserDropdown.EditProfileModal = EditProfileModal;

UserDropdown.propTypes = {
  user: PropTypes.object.isRequired,
  handleOpenEditProfileModal: PropTypes.func.isRequired
}

export default UserDropdown;
