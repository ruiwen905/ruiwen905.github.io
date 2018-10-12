import React from 'react'
import moment from 'moment'

const ProjectSummary = ({project, highlight}) => {
  return (
    <div className="col s12 m4">
      <div className="card medium z-depth-4 project-summary hoverable">
        <div className="card-image">
          <img src={project.coverImageUrl} alt="" />
          <span className="card-title opacity center"><strong>{project.title}</strong></span>

        </div>
        <div className="card-content grey-text text-darken-3">
          { project.skill.map(framework => {
            if (highlight.includes(framework)) {
              return (
                <div key={Math.random()} className="blue accent-1 chip">{framework}</div>
              )
            } else {
              return (
                <div key={Math.random()} className="chip">{framework}</div>
              )
            }
          }) }
        </div>
        <div className="card-action">
          <p className="grey-text textPadding">{moment(project.startDate.toDate()).format("MMM YYYY") + ' to ' + moment(project.endDate.toDate()).format("MMM YYYY")}</p>
        </div>
      </div>
    </div>
  )
}

export default ProjectSummary
