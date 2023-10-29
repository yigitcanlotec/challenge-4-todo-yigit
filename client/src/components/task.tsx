import React from 'react';

export default function Task({ taskId, titleText, isDone }) {
  return (
    <div id={taskId} key={taskId}>
      <p>{titleText}</p>
      <br />
    </div>
  );
}
