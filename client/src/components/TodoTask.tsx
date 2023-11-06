import React, { MouseEventHandler, useContext } from 'react';
import TaskImage from './TaskImage';

function Task({
  taskId,
  titleText,
  isDone,
  handleMarkClick,
  handleDelete,
  handleEdit,
  handleImage,
}) {
  const imageList: Array<any> = handleImage;

  return (
    <div id={taskId} className={isDone ? 'true' : ''} key={taskId}>
      <div className='task-input-container'>
        <p className='input-title' onClick={handleMarkClick}>
          {titleText}
        </p>
        <span className='material-symbols-rounded' onClick={handleDelete}>
          delete
        </span>
        <span className='material-symbols-rounded' onClick={handleEdit}>
          edit
        </span>
      </div>
      {imageList.length !== 0 &&
        imageList.map((link, index) => (
          <TaskImage key={index} imageProp={link} />
        ))}
    </div>
  );
}

export default Task;
