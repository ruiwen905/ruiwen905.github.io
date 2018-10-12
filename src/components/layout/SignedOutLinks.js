import React from 'react'
import { NavLink } from 'react-router-dom'

const SignedOutLinks = () => {
  return (
    <div>
      <ul className="right">
        <li><a href="https://github.com/ruiwen905">GitHub</a></li>
        <li><a href="https://www.linkedin.com/in/chen-rui-wen-75931a11a/">LinkedIn</a></li>
        <li><a href="https://drive.google.com/file/d/1lYdSZPADHrVGKRcgbnzNOwUcEzvVPJga/view?usp=sharing">Resume</a></li>
        <li><NavLink to='/signin'>Login</NavLink></li>
      </ul>
    </div>
  )
}

export default SignedOutLinks
