import React, { MouseEventHandler, useContext } from 'react';

export default function TaskImage(obj) {
  return <img src={obj.imageProp} alt='Description' />;
}
