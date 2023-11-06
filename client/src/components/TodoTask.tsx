import React, { MouseEventHandler, useContext, useState } from 'react';
import TaskImage from './TaskImage';
import axios from 'axios';
import ServerURLContext from '../contexts/ServerURLContext';

function Task({
  taskId,
  titleText,
  isDone,
  handleMarkClick,
  handleDelete,
  onUpdate,
  handleImage,
  getTasks,
}) {
  const imageList: Array<any> = handleImage;
  const username = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(titleText);
  const serverURL = useContext(ServerURLContext);

  const handleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleEdit = async (username, token, serverURL, newTitle, getTasks) => {
    const result = await axios.post(
      serverURL + `/api/v1/${username}/${taskId}/edit`,
      {
        title: newTitle,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (result.status === 200) {
      setEditMode(false);
      getTasks(username, token);
    }
  };

  const handleSubmit = () => {
    setEditMode(true);
  };

  const handleCloseEdit = () => {
    setEditMode(false);
  };

  return (
    <>
      {editMode ? (
        <div className='task-edit-container'>
          <input
            type='text'
            name='input-title-text'
            id='input-title-text'
            value={title}
            onChange={handleChange}
          />

          <span
            className='material-symbols-outlined'
            onClick={(e) =>
              handleEdit(username, token, serverURL, title, getTasks)
            }
          >
            done
          </span>

          <span className='material-symbols-outlined' onClick={handleCloseEdit}>
            close
          </span>
        </div>
      ) : (
        <div id={taskId} className={isDone ? 'true' : ''} key={taskId}>
          <div className='task-input-container'>
            <p className='input-title' onClick={handleMarkClick}>
              {titleText}
            </p>
            <span className='material-symbols-rounded' onClick={handleDelete}>
              delete
            </span>
            <span className='material-symbols-rounded' onClick={handleSubmit}>
              edit
            </span>
          </div>
          {imageList.length !== 0 &&
            imageList.map((link, index) => (
              <TaskImage key={index} imageProp={link} />
            ))}
        </div>
      )}
    </>
  );
}

export default Task;
