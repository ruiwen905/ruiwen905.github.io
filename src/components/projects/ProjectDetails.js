import React from 'react'
import { connect } from 'react-redux'
import { firestoreConnect } from 'react-redux-firebase'
import { compose } from 'redux'
import moment from 'moment'

const ProjectDetails = (props) => {
  const { project } = props;
  // if (!auth.uid) return <Redirect to='/signin' />
  if (project) {
    return (
      <div className="container section project-details">
        <div className="card z-depth-2">
          <div className="card-image">
            <img src={project.coverImageUrl} alt="" />
          </div>
          <div className="card-content">
            <span className="card-title">{project.title}</span>
            { project.content.map(str => <li key={Math.random()}>{str}</li> ) }
            <br/>
            { project.skill.map(framework => <div key={Math.random()} className="chip">{framework}</div>) }
            <br/>
            { project.imageUrl.map(image => <div key={Math.random()} ><img className="materialboxed container"  src={image} alt="" /><br/></div>) }
          </div>
          <div className="card-action grey lighten-4 grey-text">
            <a href=""> </a>
            { project.demo && <a href={project.demo}>Video Demo</a>}
            { project.repo && <a href={project.repo}>GitHub Repo</a>}
            <div className="right">{moment(project.startDate.toDate()).format("MMM YYYY") + ' to ' + moment(project.endDate.toDate()).format("MMM YYYY")}</div>
          </div>
        </div>

      </div>
    )
  } else {
    return (
      <div className="container center">
        <p>Loading project...</p>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  // console.log(state);
  const id = ownProps.match.params.id;
  const projects = state.firestore.data.projects;
  const project = projects ? projects[id] : null
  return {
    project: project,
    auth: state.firebase.auth
  }
}

export default compose(
  connect(mapStateToProps),
  firestoreConnect([{
    collection: 'projects'
  }])
)(ProjectDetails)
