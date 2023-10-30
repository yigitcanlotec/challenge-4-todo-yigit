import React, { MouseEventHandler, useContext } from 'react';
import ServerURLContext from '../contexts/ServerURLContext';
import axios from 'axios';
export default function Task({
  taskId,
  titleText,
  isDone,
  handleMarkClick,
  handleDelete,
}) {
  const serverURL = useContext(ServerURLContext);
  const username = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  const getTasks = async () => {
    const data = await axios
      .get(serverURL + `/api/v1/${username}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((result) => {
        return result.data;
      });
  };

  return (
    <div id={taskId} className={isDone ? 'true' : ''} key={taskId}>
      <div className='task-input-container'>
        <p className='input-title' onClick={handleMarkClick}>
          {titleText}
        </p>
        <span className='material-symbols-rounded' onClick={handleDelete}>
          delete
        </span>
      </div>
      <br />
    </div>
  );
}
