import React from 'react';

export default function Task({ taskId, titleText, isDone }) {
  return (
    <div className='task'>
      <p>{titleText}</p>
      <p>{isDone}</p>
    </div>
  );
}
