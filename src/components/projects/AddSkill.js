import React, { Component } from "react"
class AddSkill extends Component {
  // state = {
  //    skillData: [
  //     { type: 'Language',  framework: ['Javascript', 'Java', 'Python', 'Swift', 'HTML', 'CSS', 'SIMPLE', 'C++']},
  //     { type: 'Frontend',  framework: ['ReactJS', 'Redux', 'AngularJS', 'Bootstrap', 'Materialize']},
  //     { type: 'Backend', framework: ['NodeJS']},
  //     { type: 'Database', framework: ['Excel VBA', 'Google Cloud Firestore', 'MongoDB']},
  //     { type: 'Data Visualisation', framework: ['R3', 'Matplot']},
  //     { type: 'Testing / CI', framework: ['Selenium', 'Travis CI']},
  //     { type: 'Machine Learning', framework: ['Tensorflow', 'Scikit-Learn', 'Numpy', , 'Keras']},
  //     { type: 'Other API Libraries', framework: ['BeautifulSoup API', 'Youtube API', 'NUSMods API', 'NUS CORS API', 'Telegram API']}
  //   ]
  // }
  render(){
    return (
    this.props.skill.map((val, idx)=> {
      let frameworkId = `framework-${idx}`
      return (
        <div key={idx} className="input-field">
          <label htmlFor={frameworkId}>Framework</label>
          <input
            type="text"
            name={frameworkId}
            data-id={idx}
            id={frameworkId}
            value={this.props.skill[idx].name}
            className="framework"
          />
        </div>
      )
    })
  )
  }
}
export default AddSkill
