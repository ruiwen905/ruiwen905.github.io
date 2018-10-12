import React from 'react'
import ProjectSummary from './ProjectSummary'
import { Link } from 'react-router-dom'

const ProjectList = ({projects, toList}) => {
  if (toList.length > 0) {
    return (
      <div className="">
      { projects && projects.map(project => {
          let a = new Set(project.skill);
          let b = new Set(toList);
          let intersection = new Set([...a].filter(x => b.has(x)));
          if(intersection.size > 0) {
            return (
              <Link to={'/project/' + project.id} key={project.id}>
                <ProjectSummary project={project} highlight={[...intersection]}/>
              </Link>
            )
          } else {
            return null
          }
        })
      }
    </div>
    )
  } else {
    return (
      <div className="">
      { projects && projects.map(project => {
          return (
            <Link to={'/project/' + project.id} key={project.id}>
              <ProjectSummary project={project} highlight={[]}/>
            </Link>
          )
        })
      }
      </div>
    )
  }
}

export default ProjectList
