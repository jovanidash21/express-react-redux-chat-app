import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import MediaQuery from 'react-responsive';
import { Route } from 'react-router';
import mapDispatchToProps from '../actions';
import LoadingAnimation from '../components/LoadingAnimation';
import Header from './Common/Header';
import LeftSideDrawer from './Common/LeftSideDrawer';
import '../styles/Admin.scss';

class Admin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLeftSideDrawerOpen: false
    };
  }
  componentWillMount() {
    const {
      fetchUser
    } = this.props;

    fetchUser();
    document.body.className = '';
    document.body.classList.add('admin-page');
  }
  handleLeftSideDrawerRender() {
    const { isLeftSideDrawerOpen } = this.state;

    return (
      <MediaQuery query="(max-width: 767px)">
        {(matches) => {
          return (
            <LeftSideDrawer
              handleLeftSideDrawerToggleState={::this.handleLeftSideDrawerToggleState}
              isLeftSideDrawerOpen={matches ? isLeftSideDrawerOpen : true}
              noOverlay={matches ? false : true}
            />
          )
        }}
      </MediaQuery>
    )
  }
  handleLeftSideDrawerToggleEvent(openTheDrawer: false) {
    this.setState({isLeftSideDrawerOpen: openTheDrawer});
  }
  handleLeftSideDrawerToggleState(state) {
    this.setState({isLeftSideDrawerOpen: state.isOpen});
  }
  handleComponentRender(matchProps) {
    const {
      component: Content,
      user
    } = this.props;

    if (!user.isLoading && user.isSuccess) {
      return (
        <div className="admin-section">
          {::this.handleLeftSideDrawerRender()}
          <Header />
          <div className="admin-content">
            <Content {...matchProps} />
          </div>

        </div>
      )
    } else {
      return (
        <LoadingAnimation name="pacman" color="#4bb06b" />
      )
    }
  }
  render() {
    const { component, ...rest } = this.props;

    return (
      <Route {...rest} render={::this.handleComponentRender} />
    )
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.user
  }
}

Admin.propTypes = {
  component: PropTypes.func.isRequired
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Admin);
