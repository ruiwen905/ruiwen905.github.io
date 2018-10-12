import React from "react"
const AddContent = (props) => {
  return (
    props.content.map((val, idx)=> {
      let contentId = `cat-${idx}`
      return (
        <div key={idx}>
          <label htmlFor={contentId}>{`Content #${idx + 1}`}</label>
          <input
            type="text"
            name={contentId}
            data-id={idx}
            id={contentId}
            value={props.content[idx].name}
            className="name"
          />
        </div>
      )
    })
  )
}
export default AddContent
