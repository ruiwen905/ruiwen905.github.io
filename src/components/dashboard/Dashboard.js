import React, { Component } from 'react'
import ProjectList from '../projects/ProjectList'
import { connect } from 'react-redux'
import { firestoreConnect } from 'react-redux-firebase'
import { compose } from 'redux'
import Chips from 'react-chips'

class Dashboard extends Component {
  state = {
    getSkill: []
  }
  handleChange = (e) => {
    console.log(e);
    this.setState({ getSkill: e})
  }
  render() {
    const { projects } = this.props;
    // if (!auth.uid) return <Redirect to='/signin' />

    return (
      <div className="dashboard">
        <div className="row container" style={{marginTop: 2 + 'em'}}>
          <div className="col-s12">
            <Chips
              value={this.state.getSkill}
              onChange={this.handleChange}
              suggestions={['Javascript', 'Java', 'Python', 'Swift', 'HTML', 'SIMPLE', 'C++',
               'CSS', 'ReactJS', 'Redux', 'AngularJS', 'Bootstrap', 'Materialize', 'IPFS', 'Solidity',
               'NodeJS', 'Excel VBA', 'Google Cloud Firestore', 'MongoDB', 'D3', 'Keras',
               'Selenium', 'Travis CI', 'Tensorflow', 'Scikit-Learn', 'Matplot', 'Numpy',
               'BeautifulSoup API', 'Youtube API', 'NUSMods API', 'NUS CORS API', 'Telegram API']}
               placeholder="Search for projects with input framework / programming language e.g. Java or ReactJS"
            />
          </div>
        </div>
        <div className="row">
            <ProjectList projects={projects} toList={this.state.getSkill} />

          {/* <div className="col s12 m5 offset-m1">
            <Notifications notifications={notifications} />
          </div> */}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  // console.log(state);
  return {
    projects: state.firestore.ordered.projects,
    auth: state.firebase.auth,
    notifications: state.firestore.ordered.notifications
  }
}

export default compose(
  connect(mapStateToProps),
  firestoreConnect([
    { collection: 'projects', orderBy: ['startDate', 'desc']},
    { collection: 'notifications', limit: 3, orderBy: ['time', 'desc']}
  ])
)(Dashboard)
