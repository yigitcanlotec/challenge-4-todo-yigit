import React from 'react';

export default function Task({ taskId, titleText, isDone }) {
  return (
    <div key={taskId}>
      <p>
        {titleText} - {String(isDone)}
      </p>
    </div>
  );
}
