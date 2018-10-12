import React from "react"
const AddImage = (props) => {
  return (
    props.imageUrl.map((val, idx)=> {
      let imageUrlId = `image-${idx}`
      return (
        <div key={idx}>
          <label htmlFor={imageUrlId}>{`Image #${idx + 1}`}</label>
          <input
            type="text"
            name={imageUrlId}
            data-id={idx}
            id={imageUrlId}
            value={props.imageUrl[idx].name}
            className="image"
          />
        </div>
      )
    })
  )
}
export default AddImage
