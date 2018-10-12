import React from 'react'
import { NavLink } from 'react-router-dom'

const SignedOutLinks = () => {
  return (
    <div>
      <ul className="right">
        <li><a href="https://github.com/ruiwen905">GitHub Account</a></li>
        <li><a href="https://www.facebook.com/chen.ruiwen">Facebook</a></li>
        <li><a href="http://www.comp.nus.edu.sg/~ruiwen94/Resume.pdf">Resume</a></li>
        <li><NavLink to='/signin'>Login</NavLink></li>
      </ul>
    </div>
  )
}

export default SignedOutLinks
