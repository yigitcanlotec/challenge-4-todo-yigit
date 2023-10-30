import React from 'react';

export default function Task({ taskId, titleText, isDone, handleClick }) {
  return (
    <div
      id={taskId}
      className={isDone ? 'true' : ''}
      key={taskId}
      onClick={handleClick}
    >
      <div className='task-input-container'>
        <p className='input-title'>{titleText}</p>
        <span className='material-symbols-rounded'>delete</span>
      </div>
      <br />
    </div>
  );
}
