import React, { Component } from 'react'
import { connect } from 'react-redux'
import { createProject } from '../../store/actions/projectActions'
import { Redirect } from 'react-router-dom'
import DatePicker from 'react-date-picker'

import AddContent from "./AddContent"
import AddImage from "./AddImage"
import AddSkill from "./AddSkill"

class CreateProject extends Component {
  state = {
    title: '',
    content: [],
    coverImageUrl: '',
    demo: '',
    repo: '',
    startDate: new Date(),
    endDate: new Date(),
    skill: [],
    imageUrl: []
  }
  handleChange = (e) => {
    if (e.target.id !== "") {
      if (["framework"].includes(e.target.className) ) {
        let skill = [...this.state.skill]
        skill[e.target.dataset.id] = e.target.value
        this.setState({ skill })
      } else if (["name"].includes(e.target.className)) {
        let content = [...this.state.content]
        content[e.target.dataset.id] = e.target.value
        this.setState({ content })
      } else if (["image"].includes(e.target.className)) {
        let imageUrl = [...this.state.imageUrl]
        imageUrl[e.target.dataset.id] = e.target.value
        this.setState({ imageUrl })
      } else {
        this.setState({ [e.target.id]: e.target.value})
      }
    }
  }
  onStartChange = startDate => this.setState({ startDate })
  onEndChange = endDate => this.setState({ endDate })
  addContent = (e) => {
    this.setState((prevState) => ({
      content: [...prevState.content, ''],
    }));
  }
  addImage = (e) => {
    this.setState((prevState) => ({
      imageUrl: [...prevState.imageUrl, ''],
    }));
  }
  addSkill = (e) => {
    this.setState((prevState) => ({
      skill: [...prevState.skill, ''],
    }));
  }
  handleSubmit = (e) => {
    e.preventDefault();
    console.log(this.state);
    this.props.createProject(this.state);
    this.props.history.push('/');
  }
  render() {
    const { auth } = this.props;
    if (!auth.uid) return <Redirect to='/signin' />
    return (
      <div className="container">
        <form className="white" onSubmit={this.handleSubmit} onChange={this.handleChange}>
          <h5 className="grey-text text-darken-3">Create a New Project</h5>
          <div className="input-field">
            <input type="text" id='title' />
            <label htmlFor="title">Project Title</label>
          </div>
          <button type="button" className="btn pink lighten-2" onClick={this.addContent}>Add new content</button>
          <AddContent content={this.state.content} />
          <div className="input-field">
            <textarea id="coverImageUrl" className="materialize-textarea"></textarea>
            <label htmlFor="coverImageUrl">Project Cover Image URL</label>
          </div>
          <div className="row">
            <button type="button" className="btn pink lighten-2" onClick={this.addImage}>Add new image URL</button>
            <AddImage imageUrl={this.state.imageUrl} />
          </div>
          <div className="row">
            <button type="button" className="btn pink lighten-2" onClick={this.addSkill}>Add new skill</button>
            <AddSkill skill={this.state.skill} />
          </div>
          <div className="row">
            <div className="input-field col s6">
              <textarea id="demo" className="materialize-textarea"></textarea>
              <label htmlFor="demo">Video Demo</label>
            </div>
            <div className="input-field col s6">
              <textarea id="repo" className="materialize-textarea"></textarea>
              <label htmlFor="repo">Github Repo</label>
            </div>
          </div>
          <div className="row">
            <div className="col offset-s1">
              <label htmlFor="startDate">Start Date:  </label>
              <DatePicker type="date" onChange={this.onStartChange} value={this.state.startDate}/>
            </div>
            <div className="col offset-s1">
              <label htmlFor="endDate">End Date:  </label>
              <DatePicker type="date" onChange={this.onEndChange} value={this.state.endDate}/>
            </div>
          </div>
          <div className="center input-field">
            <button className="btn pink lighten-1" type="submit">Create Project</button>
          </div>
        </form>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    auth: state.firebase.auth
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createProject: (project) => dispatch(createProject(project))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateProject)
