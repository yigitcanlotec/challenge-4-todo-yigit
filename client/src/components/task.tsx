import React from 'react';

export default function Task({ taskId, titleText, isDone, handleClick }) {
  return (
    <div
      id={taskId}
      className={isDone ? 'true' : ''}
      key={taskId}
      onClick={handleClick}
    >
      <p>{titleText}</p>
      <br />
    </div>
  );
}
